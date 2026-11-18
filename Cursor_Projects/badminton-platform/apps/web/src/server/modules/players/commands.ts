import 'server-only';
import { eq } from 'drizzle-orm';
import type { Account } from '../../auth';
import { audit } from '../../audit';
import { db } from '../../db';
import { accounts, consents, players } from '../../db/schema';
import { CONSENT_VERSION, displayNameOf, type ProfileInput } from './validation';

/** Creates or updates the signed-in person's own player profile. */
export async function saveOwnProfile(account: Account, input: ProfileInput) {
  const displayName = displayNameOf(input.firstName, input.lastName);
  return db().transaction(async (tx) => {
    const existing = await tx.select().from(players).where(eq(players.accountId, account.id)).limit(1);
    if (existing[0]) {
      const before = existing[0];
      const [after] = await tx
        .update(players)
        .set({ firstName: input.firstName, lastName: input.lastName, displayName, selfTier: input.tier })
        .where(eq(players.id, before.id))
        .returning();
      await audit(tx, {
        actorAccountId: account.id,
        action: 'player.profile_updated',
        entityType: 'player',
        entityId: before.id,
        before: { firstName: before.firstName, lastName: before.lastName, selfTier: before.selfTier },
        after: { firstName: after!.firstName, lastName: after!.lastName, selfTier: after!.selfTier },
      });
      return after!;
    }
    const [created] = await tx
      .insert(players)
      .values({ accountId: account.id, firstName: input.firstName, lastName: input.lastName, displayName, selfTier: input.tier })
      .returning();
    await tx.update(accounts).set({ displayName }).where(eq(accounts.id, account.id));
    await tx.insert(consents).values([
      { accountId: account.id, kind: 'privacy_notice', version: CONSENT_VERSION },
      { accountId: account.id, kind: 'terms', version: CONSENT_VERSION },
    ]);
    await audit(tx, { actorAccountId: account.id, action: 'player.profile_created', entityType: 'player', entityId: created!.id });
    return created!;
  });
}
