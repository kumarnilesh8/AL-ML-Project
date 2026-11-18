'use server';
import { revalidatePath } from 'next/cache';
import { requireAccount } from '@/server/auth';
import { ForbiddenError } from '@/server/authz';
import * as members from '@/server/modules/members/commands';
import { guestSchema, parseEmailList, roleSchema } from '@/server/modules/members/validation';
import { baseUrl } from '@/server/url';
import type { ActionState } from '@/components/action-form';

const str = (f: FormData, k: string) => String(f.get(k) ?? '');

/** Runs a command and turns expected problems into a message for the person. */
async function run(clubId: string, fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const ok = await fn();
    revalidatePath(`/clubs/${clubId}`, 'layout');
    return { ok: ok || undefined };
  } catch (e) {
    if (e instanceof ForbiddenError || e instanceof members.MemberError) return { error: e.message };
    if (e instanceof Error && /owner|account|junior/i.test(e.message)) return { error: e.message };
    throw e;
  }
}

export async function resetLinkAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  return run(clubId, async () => {
    await members.resetJoinLink(account, clubId);
    return 'New link created. The old link no longer works.';
  });
}

export async function decideAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  return run(clubId, () => members.decideRequest(account, clubId, str(f, 'playerId'), str(f, 'decision') === 'approve'));
}

export async function setRoleAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  const role = roleSchema.safeParse(str(f, 'role'));
  if (!role.success) return { error: 'Choose a role.' };
  return run(clubId, async () => {
    const result = await members.setRole(account, clubId, str(f, 'playerId'), role.data);
    return result === 'unchanged' ? 'No change made: choose a different role first.' : 'Role updated';
  });
}

export async function removeAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  return run(clubId, () => members.removeMember(account, clubId, str(f, 'playerId')));
}

export async function addGuestAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  const parsed = guestSchema.safeParse({ firstName: str(f, 'firstName'), lastName: str(f, 'lastName'), tier: str(f, 'tier') || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  return run(clubId, async () => {
    await members.addGuest(account, clubId, parsed.data);
    return `${parsed.data.firstName} added as a guest`;
  });
}

export async function inviteAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  const list = parseEmailList(str(f, 'emails'));
  if (list.invalid.length) return { error: `Check these addresses: ${list.invalid.join(', ')}` };
  if (!list.valid.length) return { error: 'Enter at least one email address.' };
  if (list.tooMany) return { error: 'Send at most 50 invitations at a time.' };
  const origin = await baseUrl();
  return run(clubId, async () => {
    const out = await members.inviteByEmail(account, clubId, list.valid, origin);
    const parts = [];
    if (out.sent.length) parts.push(`Invitation sent to ${out.sent.length} ${out.sent.length === 1 ? 'person' : 'people'}`);
    if (out.alreadyMember.length) parts.push(`already members: ${out.alreadyMember.join(', ')}`);
    if (out.recentlyInvited.length) parts.push(`invited in the last 24 hours: ${out.recentlyInvited.join(', ')}`);
    return parts.join('; ');
  });
}

export async function addChildAction(_p: ActionState, f: FormData): Promise<ActionState> {
  const account = await requireAccount();
  const clubId = str(f, 'clubId');
  return run(clubId, async () => {
    await members.addChildToClub(account, clubId, str(f, 'childId'));
    return 'Added to the club';
  });
}
