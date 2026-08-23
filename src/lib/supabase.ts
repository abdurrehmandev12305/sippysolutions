import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The read-only Supabase client, built on the anon key.
 *
 * Both tables are world-readable behind RLS (see `supabase/schema.sql` and
 * `supabase/auth-migration.sql`), and the anon role has no write policy — so
 * the worst this client can do is read the same pricing and gallery data the
 * public pages already render.
 *
 * Writes go through {@link import("./supabase-server").supabaseServer}, which
 * carries the signed-in admin's session and is therefore governed by the
 * authenticated-only write policies. The rate limiter stays on disk and does
 * not touch this.
 */

/** Reads an env var at call time, so a missing value fails loudly, not silently. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (see .env.example) and restart the dev server — Next.js only reads .env files at startup.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

/** The bucket holding every screenshot. Public read. */
export const MEDIA_BUCKET = "media";

/**
 * How long a public page read may wait on Supabase before giving up.
 *
 * These reads sit on a visitor's critical path — the page streams its shell
 * first and then waits on this — so past a few seconds an empty state is a
 * better answer than a request that hangs until the platform's own timeout.
 * Only the public reads use it; admin writes are a human waiting on their own
 * action and can take as long as they take.
 */
export const READ_TIMEOUT_MS = 5_000;

let client: SupabaseClient | null = null;

/**
 * Lazily created and then reused. Building a client per request would open a
 * fresh connection pool each time; the client itself is stateless here because
 * nothing signs in through it.
 */
export function supabase(): SupabaseClient {
  if (client) return client;

  client = createClient(
    supabaseUrl(),
    required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    // There is no Supabase user session anywhere in this app — persisting or
    // refreshing one would just be dead weight on the server.
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  return client;
}
