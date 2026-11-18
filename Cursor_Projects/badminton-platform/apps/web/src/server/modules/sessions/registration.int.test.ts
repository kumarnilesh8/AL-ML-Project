import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAuthUser, resetDatabase } from '../../../../test/db-harness';

const URL = process.env.TEST_DATABASE_URL;
const sent: { to: string; subject: string }[] = [];
vi.mock('../../email', () => ({ sendEmail: async (m: { to: string; subject: string }) => (sent.push(m), { delivered: true }) }));
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

describe.skipIf(!URL)('sessions and registration (integration, real PostgreSQL)', () => {
  let S: typeof import('./commands');
  let Q: typeof import('./queries');
  let N: typeof import('../notifications/queries');
  const acc: Record<string, { id: string; email: string }> = {};
  const pid: Record<string, string> = {};
  let clubId = '';
  let courtIds: string[] = [];
  let childId = '';

  const form = (over: Record<string, unknown> = {}) => ({
    title: 'Tuesday night',
    date: '2027-03-09',
    startTime: '22:30',
    endTime: '01:00',
    venue: 'Al Barsha hall',
    courtIds: courtIds.slice(0, 1),
    capacity: 5,
    preset: 'balanced' as const,
    pointsToWin: 21,
    cap: 30,
    winByTwo: true,
    feeMember: '30',
    feeGuest: '40',
    feeJunior: '20',
    visibility: 'club' as const,
    closesHoursBefore: 2,
    publish: true,
    ...over,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = URL!;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_key_only';
    await resetDatabase(URL!);
    const names = ['Omar', 'Ben', 'Cara', 'Dan', 'Eva', 'Faisal', 'Gita', 'Hana'];
    for (let i = 0; i < names.length; i++) acc[names[i]!] = await createAuthUser(URL!, id(i + 1), `${names[i]!.toLowerCase()}@test.local`);
    const profiles = await import('../players/commands');
    const clubs = await import('../clubs/commands');
    const members = await import('../members/commands');
    const family = await import('../family/commands');
    S = await import('./commands');
    Q = await import('./queries');
    N = await import('../notifications/queries');
    for (const n of names) pid[n] = (await profiles.saveOwnProfile(acc[n]!, { firstName: n, lastName: 'T', tier: 'intermediate', agree: 'on' })).id;
    const club = await clubs.createClub(acc.Omar!, { name: 'Dubai Smashers', timeZone: 'Asia/Dubai', courts: 2, joinPolicy: 'open' });
    clubId = club.id;
    for (const n of names.slice(1)) if (n !== 'Gita') await members.joinByCode(acc[n]!, club.joinCode); // Gita stays outside the club
    childId = await family.addChild(acc.Dan!, { firstName: 'Sami', lastName: 'T', ageBand: 'under_14', tier: 'beginner', consent: 'on' });
    await members.addChildToClub(acc.Dan!, clubId, childId);
    const { db } = await import('../../db');
    const { courts } = await import('../../db/schema');
    courtIds = (await db().select({ id: courts.id }).from(courts)).map((c) => c.id);
  });

  afterAll(async () => {
    const { db } = await import('../../db');
    await (db() as unknown as { $client: { end: () => Promise<void> } }).$client.end();
  });

  let sessionId = '';

  it('organisers create sessions in club time; players cannot', async () => {
    await expect(S.createSession(acc.Ben!, clubId, form())).rejects.toThrow(/permission/);
    sessionId = await S.createSession(acc.Omar!, clubId, form());
    const v = await Q.getSessionView(acc.Ben!.id, clubId, sessionId);
    expect(v.session.startsAt.toISOString()).toBe('2027-03-09T18:30:00.000Z'); // 22:30 UAE
    expect(v.session.endsAt.toISOString()).toBe('2027-03-09T21:00:00.000Z'); // 01:00 next day UAE
    expect(v.session.fees).toEqual({ member: 3000, guest: 4000, junior: 2000 });
  });

  it('two people grabbing the last place at once: exactly one gets it', async () => {
    await S.register(acc.Omar!, sessionId, pid.Omar!);
    await S.register(acc.Ben!, sessionId, pid.Ben!);
    await S.register(acc.Cara!, sessionId, pid.Cara!);
    await S.register(acc.Hana!, sessionId, pid.Hana!);
    const [a, b] = await Promise.all([S.register(acc.Dan!, sessionId, pid.Dan!), S.register(acc.Eva!, sessionId, pid.Eva!)]);
    expect([a.status, b.status].sort()).toEqual(['registered', 'waitlisted']);
    const v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.registered).toHaveLength(5);
    expect(v.waitlist.map((w) => w.position)).toEqual([1]);
  });

  it('a parent registers their child; outsiders and other people’s players are refused', async () => {
    expect((await S.register(acc.Dan!, sessionId, childId)).status).toBe('waitlisted');
    await expect(S.register(acc.Ben!, sessionId, childId)).rejects.toThrow(/permission/);
    await expect(S.register(acc.Gita!, sessionId, pid.Gita!)).rejects.toThrow(/Join the club/);
    const v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.waitlist.map((w) => w.position)).toEqual([1, 2]);
    expect(v.waitlist.find((w) => w.playerId === childId)!.name).toBe('Sami T.');
  });

  it('cancelling frees a place: the first person waiting is promoted and told', async () => {
    const firstWaiting = (await Q.getSessionView(acc.Omar!.id, clubId, sessionId)).waitlist[0]!.playerId;
    const name = Object.entries(pid).find(([, v]) => v === firstWaiting)![0];
    await S.cancelRegistration(acc.Ben!, sessionId, pid.Ben!);
    const v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.registered.map((r) => r.playerId)).toContain(firstWaiting);
    expect(v.waitlist).toHaveLength(1);
    expect(v.waitlist[0]!.position).toBe(1);
    expect(sent.some((e) => e.to === `${name!.toLowerCase()}@test.local` && /You have a place/.test(e.subject))).toBe(true);
    expect((await N.listNotifications(acc[name!]!.id)).some((n) => n.type === 'promoted')).toBe(true);
  });

  it('organisers can add over capacity, reorder the waiting list and remove people', async () => {
    const out = await S.organiserAdd(acc.Omar!, sessionId, pid.Faisal!);
    expect(out.overCapacity).toBe(true);
    await S.organiserMoveToWaitlist(acc.Omar!, sessionId, pid.Faisal!);
    let v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.waitlist.map((w) => w.playerId)).toEqual([childId, pid.Faisal]);
    await S.moveInWaitlist(acc.Omar!, sessionId, pid.Faisal!, 'up');
    v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.waitlist.map((w) => [w.playerId, w.position])).toEqual([[pid.Faisal, 1], [childId, 2]]);
    await expect(S.moveInWaitlist(acc.Cara!, sessionId, pid.Faisal!, 'down')).rejects.toThrow(/permission/);
    await S.organiserRemove(acc.Omar!, sessionId, pid.Faisal!);
    v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.waitlist.map((w) => [w.playerId, w.position])).toEqual([[childId, 1]]);
  });

  it('reducing capacity moves the latest registrations to the top of the waiting list', async () => {
    await S.updateSession(acc.Omar!, sessionId, form({ capacity: 4 }));
    const v = await Q.getSessionView(acc.Omar!.id, clubId, sessionId);
    expect(v.registered).toHaveLength(4);
    expect(v.waitlist).toHaveLength(2);
    expect(v.waitlist[1]!.playerId).toBe(childId);
  });

  it('changing the time notifies everyone; cancelling the session tells them too', async () => {
    sent.length = 0;
    await S.updateSession(acc.Omar!, sessionId, form({ capacity: 4, startTime: '21:00', endTime: '23:30' }));
    expect(sent.filter((e) => /^Changed:/.test(e.subject)).length).toBeGreaterThanOrEqual(4);
    await S.cancelSession(acc.Omar!, sessionId, 'Hall closed for maintenance');
    expect(sent.filter((e) => /^Cancelled:/.test(e.subject)).length).toBeGreaterThanOrEqual(4);
    await expect(S.register(acc.Gita!, sessionId, pid.Gita!)).rejects.toThrow();
    await expect(S.register(acc.Ben!, sessionId, pid.Ben!)).rejects.toThrow(/cancelled/);
  });

  it('drafts are hidden from players until opened; duplicates are drafts a week later', async () => {
    const copy = await S.duplicateSession(acc.Omar!, sessionId);
    await expect(Q.getSessionView(acc.Ben!.id, clubId, copy)).rejects.toThrow();
    await expect(S.register(acc.Ben!, copy, pid.Ben!)).rejects.toThrow(/not opened/);
    await S.openSession(acc.Omar!, copy);
    expect((await S.register(acc.Ben!, copy, pid.Ben!)).status).toBe('registered');
    const list = await Q.listUpcomingSessions(acc.Ben!.id, clubId, 'player');
    expect(list.some((s) => s.id === copy)).toBe(true);
  });

  it('upcoming registrations appear on the player’s page, including children', async () => {
    const up = await Q.myUpcoming(acc.Ben!.id);
    expect(up.length).toBeGreaterThanOrEqual(1);
    expect(up[0]!.status).toBe('registered');
  });
});
