import 'server-only';
import { and, eq, isNull } from 'drizzle-orm';
import type { Account } from '../../auth';
import { audit } from '../../audit';
import { ForbiddenError } from '../../authz';
import { db } from '../../db';
import { clubMembers, consents, players } from '../../db/schema';
import { CONSENT_VERSION } from '../players/validation';
import type { ChildInput } from './validation';

/** A parent adds a junior to their family. Parental consent is recorded. */
export async function addChild(account: Account, input: ChildInput) {
  return db().transaction(async (tx) => {
    const initial = input.lastName ? ` ${input.lastName[0]!.toUpperCase()}.` : '';
    const [child] = await tx
      .insert(players)
      .values({
        managedByAccountId: account.id,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: `${input.firstName}${initial}`,
        ageBand: input.ageBand,
        selfTier: input.tier,
        consentRecordedAt: new Date(),
        privacy: { show_rating: false, in_rankings: false },
      })
      .returning({ id: players.id });
    await tx.insert(consents).values({ accountId: account.id, playerId: child!.id, kind: 'junior_parental', version: CONSENT_VERSION });
    await audit(tx, { actorAccountId: account.id, action: 'family.child_added', entityType: 'player', entityId: child!.id, after: { ageBand: input.ageBand } });
    return child!.id;
  });
}

/** Removes a child's profile: personal details erased, history kept as "Former player". */
export async function removeChild(account: Account, childId: string) {
  return db().transaction(async (tx) => {
    const [child] = await tx
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.id, childId), eq(players.managedByAccountId, account.id), isNull(players.deletedAt)))
      .limit(1);
    if (!child) throw new ForbiddenError();
    await tx
      .update(players)
      .set({ firstName: 'Former', lastName: 'player', displayName: 'Former player', photoPath: null, gender: null, preferences: {}, deletedAt: new Date() })
      .where(eq(players.id, childId));
    await tx.update(clubMembers).set({ status: 'removed', removedAt: new Date() }).where(eq(clubMembers.playerId, childId));
    await audit(tx, { actorAccountId: account.id, action: 'family.child_removed', entityType: 'player', entityId: childId });
  });
}
