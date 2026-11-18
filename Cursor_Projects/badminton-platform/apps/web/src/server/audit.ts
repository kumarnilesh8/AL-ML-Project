import 'server-only';
import type { Tx } from './db';
import { auditLog } from './db/schema';

export async function audit(
  tx: Tx,
  entry: { clubId?: string | null; actorAccountId: string | null; action: string; entityType: string; entityId?: string | null; before?: unknown; after?: unknown; reason?: string | null },
) {
  await tx.insert(auditLog).values({
    clubId: entry.clubId ?? null,
    actorAccountId: entry.actorAccountId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
  });
}
