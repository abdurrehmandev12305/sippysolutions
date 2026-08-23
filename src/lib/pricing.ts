import { randomUUID } from "node:crypto";

import { READ_TIMEOUT_MS, supabase } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Read/write access to the `pricing_plans` table — the single source of truth
 * for the public `/pricing` page and the admin Pricing Manager.
 *
 * Reads use the anon key (the table is world-readable behind RLS). Writes go
 * through the signed-in admin's own session, so the authenticated-only
 * insert/update/delete policies in `supabase/auth-migration.sql` are what
 * authorises them — nothing here bypasses RLS.
 *
 * Everything here is server-only: `supabase-server` refuses to load in a
 * Client Component, so this module must never be imported from one either.
 */

export type Spec = {
  /** e.g. "CPU" */
  label: string;
  /** e.g. "Intel Xeon E3-1246V3" */
  value: string;
};

export type Plan = {
  id: string;
  /** e.g. "Concurrent Calls 50" */
  name: string;
  specs: Spec[];
  /** e.g. "Germany" */
  location: string;
  /** Optional flag emoji shown beside the location, e.g. "🇩🇪". */
  flag: string;
  /** Currency symbol, e.g. "€". */
  currency: string;
  price: number;
  /** e.g. "Per Month" */
  period: string;
};

/** The shape a plan takes on the wire — no `id` when creating. */
export type PlanInput = Omit<Plan, "id"> & { id?: string };

const TABLE = "pricing_plans";

const DEFAULT_CURRENCY = "€";
const DEFAULT_PERIOD = "Per Month";

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Coerces `"80"`, `"€80"` and `80` alike to `80`. Returns `null` for anything
 * that isn't a finite, non-negative number — including junk like `"abc"`,
 * which must not quietly become a free plan.
 *
 * This also absorbs the one shape change Postgres introduces: a `numeric`
 * column can come back over the wire as the string `"80.00"`, which lands
 * here as `80` — so `PricingCard` still renders a plain number.
 */
function asPrice(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  // Tolerate a currency symbol pasted in front of the number, nothing else.
  // A minus is deliberately left in place so "-5" fails the test below rather
  // than being stripped into a positive 5.
  const text = asTrimmedString(value).replace(/^[^\d.-]+/, "");
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : null;
}

function parseSpecs(value: unknown): { specs: Spec[] } | { errors: string[] } {
  if (!Array.isArray(value)) {
    return { errors: ["Specs must be a list."] };
  }

  const specs: Spec[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;

    const raw = entry as Record<string, unknown>;
    const label = asTrimmedString(raw.label);
    const specValue = asTrimmedString(raw.value);

    // A row the admin left completely blank is dropped rather than rejected.
    if (!label && !specValue) continue;
    if (!label || !specValue) {
      return { errors: ["Every spec needs both a label and a value."] };
    }

    specs.push({ label, value: specValue });
  }

  return specs.length > 0 ? { specs } : { errors: ["Add at least one spec."] };
}

/**
 * Validates an untrusted plan payload and normalises it. Unknown keys are
 * dropped; `id` is preserved when present so the same parser serves both
 * "create" and "update".
 */
export function parsePlan(
  body: unknown,
): { plan: Plan } | { errors: string[] } {
  if (typeof body !== "object" || body === null) {
    return { errors: ["Plan must be a JSON object."] };
  }

  const raw = body as Record<string, unknown>;
  const errors: string[] = [];

  const name = asTrimmedString(raw.name);
  if (!name) errors.push("Plan name is required.");

  const location = asTrimmedString(raw.location);
  if (!location) errors.push("Server location is required.");

  const price = asPrice(raw.price);
  if (price === null) errors.push("Price must be a positive number.");

  const parsedSpecs = parseSpecs(raw.specs);
  if ("errors" in parsedSpecs) errors.push(...parsedSpecs.errors);

  if (errors.length > 0) return { errors };

  return {
    plan: {
      id: asTrimmedString(raw.id) || randomUUID(),
      name,
      specs: (parsedSpecs as { specs: Spec[] }).specs,
      location,
      flag: asTrimmedString(raw.flag),
      currency: asTrimmedString(raw.currency) || DEFAULT_CURRENCY,
      price: price as number,
      period: asTrimmedString(raw.period) || DEFAULT_PERIOD,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

/** The columns the app renders — the timestamps stay in the database. */
const COLUMNS = "id, name, specs, location, flag, currency, price, period";

/**
 * Reads every plan in display order. A row that fails validation is skipped
 * rather than thrown on, so one bad hand-edit in the Supabase table editor
 * can't take the public page down — the same forgiveness the JSON file got.
 *
 * Nothing in here throws. Every failure — a query error, a missing env var, a
 * connection that never answers — comes back as an empty list, because the
 * caller already renders a "plans are being updated" state for that and a
 * visitor should get it instead of an error page.
 */
export async function readPlans(): Promise<Plan[]> {
  try {
    const { data, error } = await supabase()
      .from(TABLE)
      .select(COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      // Bounded so a Supabase cold start or a network stall can't hold the
      // page's streaming boundary open indefinitely.
      .abortSignal(AbortSignal.timeout(READ_TIMEOUT_MS));

    if (error) {
      // The reason lands in the server log rather than in a visitor's face.
      console.error(`[pricing] couldn't read ${TABLE}: ${error.message}`);
      return [];
    }

    return (data ?? []).flatMap((row) => {
      const result = parsePlan(row);
      return "plan" in result ? [result.plan] : [];
    });
  } catch (cause) {
    // Two things reject rather than returning `{ error }`: `supabase()` itself,
    // which throws when its env vars are unset, and the fetch underneath, which
    // rejects on an abort or a refused connection. Both used to escape this
    // function and turn the whole route into a 500.
    const reason = cause instanceof Error ? cause.message : String(cause);
    console.error(`[pricing] couldn't reach ${TABLE}: ${reason}`);
    return [];
  }
}

/** Maps a validated plan onto its table row. `id` is set only on insert. */
function toRow(plan: Plan): Record<string, unknown> {
  return {
    name: plan.name,
    specs: plan.specs,
    location: plan.location,
    flag: plan.flag,
    currency: plan.currency,
    price: plan.price,
    period: plan.period,
  };
}

/** Postgres unique-violation — the plan id is already taken. */
const UNIQUE_VIOLATION = "23505";

type Outcome<T> =
  | { ok: true; plans: Plan[]; result: T }
  | { ok: false; error: string };

/** Answers a successful write with the full, freshly read list. */
async function succeed<T>(result: T): Promise<Outcome<T>> {
  return { ok: true, plans: await readPlans(), result };
}

/**
 * Appends after the current last plan. Two creates racing could pick the same
 * number; the `created_at` tiebreak in `readPlans` keeps the resulting order
 * deterministic anyway, and nothing in the dashboard reorders plans.
 */
async function nextSortOrder(): Promise<number> {
  const { data } = await (await supabaseServer())
    .from(TABLE)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const last = (data as { sort_order?: number } | null)?.sort_order;
  return typeof last === "number" ? last + 1 : 0;
}

export async function createPlan(plan: Plan): Promise<Outcome<Plan>> {
  const { error } = await (await supabaseServer())
    .from(TABLE)
    .insert({ ...toRow(plan), id: plan.id, sort_order: await nextSortOrder() });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "A plan with that id already exists." };
    }

    console.error(`[pricing] couldn't create a plan: ${error.message}`);
    return { ok: false, error: "Couldn't save that plan. Please try again." };
  }

  return succeed(plan);
}

export async function updatePlan(plan: Plan): Promise<Outcome<Plan>> {
  // `sort_order` is deliberately absent from the patch: editing a plan must
  // not move it in the grid.
  const { data, error } = await (await supabaseServer())
    .from(TABLE)
    .update(toRow(plan))
    .eq("id", plan.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`[pricing] couldn't update ${plan.id}: ${error.message}`);
    return { ok: false, error: "Couldn't save that plan. Please try again." };
  }

  if (!data) return { ok: false, error: "That plan no longer exists." };

  return succeed(plan);
}

export async function deletePlan(id: string): Promise<Outcome<string>> {
  const { data, error } = await (await supabaseServer())
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(`[pricing] couldn't delete ${id}: ${error.message}`);
    return { ok: false, error: "Couldn't delete that plan. Please try again." };
  }

  if (!data) return { ok: false, error: "That plan no longer exists." };

  return succeed(id);
}
