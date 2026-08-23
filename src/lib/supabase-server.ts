import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { supabaseUrl } from "@/lib/supabase";

/**
 * The request-scoped Supabase client — the one carrying the signed-in admin's
 * session.
 *
 * Built on the anon key, not the service role: every query runs as the logged-in
 * user, so the policies in `supabase/auth-migration.sql` are what actually
 * authorise writes. That is the point of moving off `supabase-admin.ts` — the
 * policies become real enforcement rather than decoration.
 */

function anonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to .env.local (see .env.example) and restart the dev server — Next.js only reads .env files at startup.",
    );
  }
  return key;
}

export async function supabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          for (const { name, value, options } of list) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where the cookie store is
          // read-only. `proxy.ts` refreshes the session on every request, so
          // rotated tokens still reach the browser — this is the documented
          // no-op case, not an error worth surfacing.
        }
      },
    },
  });
}

/**
 * The signed-in admin, or `null`.
 *
 * Always `getUser()`, never `getSession()`: getSession reads the cookie and
 * trusts it, getUser revalidates the JWT with Supabase. This is an
 * authorisation boundary, so it has to be the checked one.
 */
export async function currentAdmin(): Promise<User | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}
