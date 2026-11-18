import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;
const globalForDb = globalThis as unknown as { bpDb?: Database };

/** Server-only database access. Browsers never connect to the database directly. */
export function db(): Database {
  if (!globalForDb.bpDb) {
    // prepare: false keeps this compatible with connection poolers in the cloud.
    const client = postgres(env().DATABASE_URL, { prepare: false, max: 5 });
    globalForDb.bpDb = drizzle(client, { schema });
  }
  return globalForDb.bpDb;
}

export type Db = Database;
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
export { schema };
