/**
 * Builds a fresh test database from the real migrations (plus a stand-in for Supabase's auth schema).
 * Used by *.int.test.ts files; they are skipped unless TEST_DATABASE_URL is set.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';

const root = join(__dirname, '..', '..', '..');

export async function resetDatabase(url: string) {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql.unsafe(`
    drop schema if exists public cascade; drop schema if exists app cascade; drop schema if exists auth cascade;
    create schema public; grant all on schema public to public;`);
  await sql.unsafe(readFileSync(join(root, 'supabase/checks/stub-auth.sql'), 'utf8'));
  const dir = join(root, 'supabase/migrations');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
    await sql.unsafe(readFileSync(join(dir, f), 'utf8'));
  }
  await sql.end();
}

export async function createAuthUser(url: string, id: string, email: string) {
  const sql = postgres(url, { max: 1 });
  await sql`insert into auth.users (id, email) values (${id}, ${email})`;
  await sql.end();
  return { id, email };
}
