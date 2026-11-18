import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAuthUser, resetDatabase } from '../../../../test/db-harness';

const URL = process.env.TEST_DATABASE_URL;
const sent: { to: string; text: string }[] = [];
vi.mock('../../email', () => ({
  sendEmail: async (m: { to: string; subject: string; text: string }) => {
    sent.push(m);
    return { delivered: true };
  },
}));

const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

describe.skipIf(!URL)('members (integration, real PostgreSQL)', () => {
  let m: typeof import('./commands');
  let q: typeof import('./queries');
  let clubs: typeof import('../clubs/commands');
  let profiles: typeof import('../players/commands');
  let family: typeof import('../family/commands');
  let owner: { id: string; email: string }, ben: { id: string; email: string }, cara: { id: string; email: string };
  let dan: { id: string; email: string }, friend: { id: string; email: string };
  let clubId = '';
  let joinCode = '';
  const pid: Record<string, string> = {};

  beforeAll(async () => {
    process.env.DATABASE_URL = URL!;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_key_only';
    await resetDatabase(URL!);
    owner = await createAuthUser(URL!, id(1), 'owner@test.local');
    ben = await createAuthUser(URL!, id(2), 'ben@test.local');
    cara = await createAuthUser(URL!, id(3), 'cara@test.local');
    dan = await createAuthUser(URL!, id(4), 'dan@test.local');
    friend = await createAuthUser(URL!, id(5), 'friend@test.local');
    m = await import('./commands');
    q = await import('./queries');
    clubs = await import('../clubs/commands');
    profiles = await import('../players/commands');
    family = await import('../family/commands');
    for (const [a, name] of [[owner, 'Omar'], [ben, 'Ben'], [cara, 'Cara'], [dan, 'Dan'], [friend, 'Fatima']] as const) {
      pid[name] = (await profiles.saveOwnProfile(a, { firstName: name, lastName: 'Test', tier: 'intermediate', agree: 'on' })).id;
    }
    const club = await clubs.createClub(owner, { name: 'Dubai Smashers', timeZone: 'Asia/Dubai', courts: 4, joinPolicy: 'open' });
    clubId = club.id;
    joinCode = club.joinCode;
  });

  afterAll(async () => {
    const { db } = await import('../../db');
    await (db() as unknown as { $client: { end: () => Promise<void> } }).$client.end();
  });

  it('anyone with the link joins an open club straight away', async () => {
    expect(joinCode).toMatch(/^[a-z0-9]{10}$/);
    expect(await m.joinByCode(ben, joinCode)).toEqual({ clubId, status: 'active' });
    expect(await m.joinByCode(ben, joinCode)).toEqual({ clubId, status: 'active' }); // idempotent
  });

  it('approval clubs create a request that only owners/admins can decide', async () => {
    const approvalClub = await clubs.createClub(owner, { name: 'Ladies Night Club', timeZone: 'Asia/Dubai', courts: 2, joinPolicy: 'approval' });
    expect((await m.joinByCode(cara, approvalClub.joinCode)).status).toBe('pending');
    await m.joinByCode(ben, approvalClub.joinCode);
    await expect(m.decideRequest(ben, approvalClub.id, pid.Cara!, true)).rejects.toThrow(/permission/);
    await m.decideRequest(owner, approvalClub.id, pid.Cara!, true);
    expect(await q.countPending(approvalClub.id)).toBe(1); // Ben still pending
  });

  it('roles follow the permission table and the database rules', async () => {
    await m.joinByCode(cara, joinCode);
    await m.joinByCode(dan, joinCode);
    await m.setRole(owner, clubId, pid.Ben!, 'admin');
    await expect(m.setRole(ben, clubId, pid.Cara!, 'admin')).rejects.toThrow(/permission/);
    await m.setRole(ben, clubId, pid.Cara!, 'organiser');
    await expect(m.setRole(cara, clubId, pid.Dan!, 'organiser')).rejects.toThrow(/permission/);
    // the last owner cannot step down
    await expect(m.setRole(owner, clubId, pid.Omar!, 'player')).rejects.toThrow();
  });

  it('organisers add guests; players cannot', async () => {
    const guest = await m.addGuest(cara, clubId, { firstName: 'Mark', lastName: 'Visitor', tier: 'improver' });
    expect(guest).toBeTruthy();
    await expect(m.addGuest(dan, clubId, { firstName: 'X', lastName: '', tier: 'beginner' })).rejects.toThrow(/permission/);
  });

  it('emails are shown only to owners and admins', async () => {
    const asOwner = await q.listMembers(clubId, { accountId: owner.id, role: 'owner' });
    const asPlayer = await q.listMembers(clubId, { accountId: dan.id, role: 'player' });
    expect(asOwner.find((r) => r.name.startsWith('Ben'))!.email).toBe('ben@test.local');
    expect(asPlayer.every((r) => r.email === null)).toBe(true);
    expect(asOwner.find((r) => r.name.startsWith('Mark'))!.kind).toBe('guest');
    expect((await q.listMembers(clubId, { accountId: owner.id, role: 'owner' }, { q: 'car' })).map((r) => r.name)).toEqual(['Cara Test']);
  });

  it('email invitations: skip members and recent invites; accept only with the invited email', async () => {
    const out = await m.inviteByEmail(owner, clubId, ['friend@test.local', 'ben@test.local'], 'http://localhost:3000');
    expect(out.sent).toEqual(['friend@test.local']);
    expect(out.alreadyMember).toEqual(['ben@test.local']);
    expect((await m.inviteByEmail(owner, clubId, ['friend@test.local'], 'http://localhost:3000')).recentlyInvited).toEqual(['friend@test.local']);
    await expect(m.inviteByEmail(dan, clubId, ['x@test.local'], 'http://localhost:3000')).rejects.toThrow(/permission/);

    const token = sent.at(-1)!.text.match(/\/invite\/([A-Za-z0-9_-]+)/)![1]!;
    await expect(m.acceptInvite(dan, token)).rejects.toThrow(/sent to friend@test.local/);
    expect(await m.acceptInvite(friend, token)).toEqual({ clubId });
    expect(await m.acceptInvite(friend, token)).toEqual({ clubId }); // already accepted by the same person
  });

  it('resetting the join link makes the old link stop working', async () => {
    const newCode = await m.resetJoinLink(owner, clubId);
    expect(newCode).not.toEqual(joinCode);
    await expect(m.joinByCode(owner, joinCode)).rejects.toThrow(/not valid/);
  });

  it('juniors: parent adds a child, adds them to the club; a child cannot become an organiser', async () => {
    const childId = await family.addChild(dan, { firstName: 'Sami', lastName: 'Test', ageBand: 'under_14', tier: 'beginner', consent: 'on' });
    await m.addChildToClub(dan, clubId, childId);
    const rows = await q.listMembers(clubId, { accountId: owner.id, role: 'owner' }, { filter: 'juniors' });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe('Sami T.');
    expect(rows[0]!.email).toBeNull();
    await expect(m.setRole(owner, clubId, childId, 'organiser')).rejects.toThrow();
    await expect(m.addChildToClub(ben, clubId, childId)).rejects.toThrow(/permission/); // not Ben's child
    await family.removeChild(dan, childId);
    expect(await q.listMembers(clubId, { accountId: owner.id, role: 'owner' }, { filter: 'juniors' })).toHaveLength(0);
  });

  it('members can leave; admins cannot remove the owner', async () => {
    await m.removeMember(dan, clubId, pid.Dan!);
    await expect(m.removeMember(ben, clubId, pid.Omar!)).rejects.toThrow(/permission/);
    expect((await q.listMembers(clubId, { accountId: owner.id, role: 'owner' })).some((r) => r.name.startsWith('Dan'))).toBe(false);
  });
});
