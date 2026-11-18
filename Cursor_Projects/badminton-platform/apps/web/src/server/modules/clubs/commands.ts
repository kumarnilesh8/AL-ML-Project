import 'server-only';
import { and, eq, isNull, like } from 'drizzle-orm';
import type { Account } from '../../auth';
import { audit } from '../../audit';
import { db } from '../../db';
import { clubMembers, clubs, courts, players } from '../../db/schema';
import { newJoinCode } from '../members/tokens';
import { slugify, type CreateClubInput } from './validation';

export class NeedsProfileError extends Error {
  constructor() {
    super('Create your player profile before creating a club.');
  }
}

/** Creates a club with its courts; the creator becomes the owner. One transaction, audited. */
export async function createClub(account: Account, input: CreateClubInput) {
  return db().transaction(async (tx) => {
    const [me] = await tx
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.accountId, account.id), isNull(players.deletedAt)))
      .limit(1);
    if (!me) throw new NeedsProfileError();

    // Unique, readable slug: dubai-smashers, dubai-smashers-2, ...
    const base = slugify(input.name);
    const taken = new Set(
      (await tx.select({ slug: clubs.slug }).from(clubs).where(like(clubs.slug, `${base}%`))).map((r) => r.slug),
    );
    let slug = base;
    for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;

    const [club] = await tx
      .insert(clubs)
      .values({ slug, name: input.name, timeZone: input.timeZone, joinPolicy: input.joinPolicy, joinCode: newJoinCode(), createdBy: account.id })
      .returning();
    await tx.insert(clubMembers).values({ clubId: club!.id, playerId: me.id, role: 'owner' });
    await tx.insert(courts).values(
      Array.from({ length: input.courts }, (_, i) => ({ clubId: club!.id, name: `Court ${i + 1}`, sortOrder: i + 1 })),
    );
    await audit(tx, {
      clubId: club!.id,
      actorAccountId: account.id,
      action: 'club.created',
      entityType: 'club',
      entityId: club!.id,
      after: { name: input.name, timeZone: input.timeZone, courts: input.courts, joinPolicy: input.joinPolicy },
    });
    return club!;
  });
}
