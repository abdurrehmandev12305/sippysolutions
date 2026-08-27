import { READ_TIMEOUT_MS, supabase } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Read/write access to the `demo_access` table — the single source of truth
 * for the "Demo" popover on `/user-interface` and the admin Demo Access
 * Manager.
 *
 * Unlike `pricing_plans` or `media_items`, this table holds exactly one row
 * (`id = 1`, enforced by a check constraint in
 * `supabase/demo-access-migration.sql`), so there is no create/delete here —
 * only read and update.
 *
 * Reads use the anon key (the table is world-readable behind RLS). Writes go
 * through the signed-in admin's own session, so the authenticated-only
 * update policy in that same migration is what authorises them — nothing
 * here bypasses RLS.
 *
 * Everything here is server-only: `supabase-server` refuses to load in a
 * Client Component, so this module must never be imported from one either.
 */

export type DemoAccess = {
  url: string;
  username: string;
  password: string;
};

const TABLE = "demo_access";
const ROW_ID = 1;
const COLUMNS = "url, username, password";

const BLANK: DemoAccess = { url: "", username: "", password: "" };

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates an untrusted demo-access payload and normalises it. Unknown keys
 * are dropped.
 */
export function parseDemoAccess(
  body: unknown,
): { access: DemoAccess } | { errors: string[] } {
  if (typeof body !== "object" || body === null) {
    return { errors: ["Demo access must be a JSON object."] };
  }

  const raw = body as Record<string, unknown>;
  const errors: string[] = [];

  const url = asTrimmedString(raw.url);
  if (!url) errors.push("URL is required.");

  const username = asTrimmedString(raw.username);
  if (!username) errors.push("Username is required.");

  const password = asTrimmedString(raw.password);
  if (!password) errors.push("Password is required.");

  if (errors.length > 0) return { errors };

  return { access: { url, username, password } };
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Reads the one demo-access row. A row that fails validation (or is simply
 * missing — the seed insert in the migration didn't run) comes back as blank
 * fields rather than thrown on, matching how `readPlans`/`readMedia` treat a
 * bad or empty table: a visitor gets an empty popover instead of an error
 * page.
 *
 * Nothing in here throws. Every failure — a query error, a missing env var, a
 * connection that never answers — comes back as `BLANK`.
 */
export async function readDemoAccess(): Promise<DemoAccess> {
  try {
    const { data, error } = await supabase()
      .from(TABLE)
      .select(COLUMNS)
      .eq("id", ROW_ID)
      // Bounded so a Supabase cold start or a network stall can't hold the
      // page's streaming boundary open indefinitely.
      .abortSignal(AbortSignal.timeout(READ_TIMEOUT_MS))
      .maybeSingle();

    if (error) {
      // The reason lands in the server log rather than in a visitor's face.
      console.error(`[demo-access] couldn't read ${TABLE}: ${error.message}`);
      return BLANK;
    }

    if (!data) return BLANK;

    const parsed = parseDemoAccess(data);
    return "access" in parsed ? parsed.access : BLANK;
  } catch (cause) {
    // Two things reject rather than returning `{ error }`: `supabase()` itself,
    // which throws when its env vars are unset, and the fetch underneath, which
    // rejects on an abort or a refused connection. Both used to escape this
    // function and turn the whole route into a 500.
    const reason = cause instanceof Error ? cause.message : String(cause);
    console.error(`[demo-access] couldn't reach ${TABLE}: ${reason}`);
    return BLANK;
  }
}

type Outcome<T> =
  | { ok: true; access: DemoAccess; result: T }
  | { ok: false; error: string };

export async function updateDemoAccess(
  access: DemoAccess,
): Promise<Outcome<DemoAccess>> {
  const { data, error } = await (await supabaseServer())
    .from(TABLE)
    .update(access)
    .eq("id", ROW_ID)
    .select("url")
    .maybeSingle();

  if (error) {
    console.error(`[demo-access] couldn't update ${TABLE}: ${error.message}`);
    return { ok: false, error: "Couldn't save demo access. Please try again." };
  }

  if (!data) {
    return {
      ok: false,
      error: "The demo access row is missing. Re-run the Supabase migration.",
    };
  }

  return { ok: true, access, result: access };
}
