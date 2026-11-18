import 'server-only';
import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  DATABASE_URL: z.string().startsWith('postgres'),
  LOCAL_MAILBOX_URL: z.string().optional(),
});

let cached: z.infer<typeof schema> | null = null;

/** Validated server settings. Fails with a clear message if .env.local is missing or incomplete. */
export function env() {
  if (cached) return cached;
  const r = schema.safeParse(process.env);
  if (!r.success) {
    const fields = r.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Missing or invalid settings (${fields}) in apps/web/.env.local. Run "pnpm env:local".`);
  }
  cached = r.data;
  return cached;
}
