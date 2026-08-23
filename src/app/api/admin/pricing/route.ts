import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { currentAdmin } from "@/lib/supabase-server";
import { forbiddenOrigin, isSameOrigin } from "@/lib/csrf";
import {
  createPlan,
  deletePlan,
  parsePlan,
  readPlans,
  updatePlan,
} from "@/lib/pricing";

/**
 * Pricing Manager endpoint — the Supabase `pricing_plans` table is the store.
 *
 *   GET     list every plan
 *   POST    create a plan (body: plan without `id`)
 *   PUT     replace a plan (body: plan with `id`)
 *   DELETE  remove a plan (`?id=…`)
 *
 * Every method requires an admin session. Each write answers with the full
 * updated list, so the dashboard never has to guess at the new state.
 */

/** Guards a handler; returns a 401 response when there's no session. */
async function requireAdmin(): Promise<Response | null> {
  if (await currentAdmin()) return null;

  return Response.json(
    { ok: false, errors: ["You must be signed in."] },
    { status: 401 },
  );
}

function badRequest(errors: string[], status = 400) {
  return Response.json({ ok: false, errors }, { status });
}

/**
 * Drops the cached `/pricing` page after a write.
 *
 * That page is prerendered with `revalidate = 30`, so without this an edit made
 * here would take up to half a minute to reach visitors. From a Route Handler
 * this marks the path rather than rebuilding it on the spot: the next request
 * for `/pricing` renders fresh and repopulates the cache, so the admin's change
 * is live on the next visit instead of on the next timer tick.
 *
 * The dashboard's own view doesn't depend on this — it renders per request and
 * each write already answers with the full updated list.
 */
function revalidatePricing() {
  revalidatePath("/pricing");
}

/** Sentinel for an unparseable body — `null` and `undefined` are valid JSON. */
const INVALID_JSON = Symbol("invalid-json");

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return INVALID_JSON;
  }
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return Response.json({ ok: true, plans: await readPlans() });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (body === INVALID_JSON) return badRequest(["Request body must be valid JSON."]);

  // A create always mints a fresh id, so a client-supplied one is ignored.
  const parsed = parsePlan({ ...(body as object), id: undefined });
  if ("errors" in parsed) return badRequest(parsed.errors);

  const result = await createPlan(parsed.plan);
  if (!result.ok) return badRequest([result.error], 409);

  revalidatePricing();
  return Response.json({ ok: true, plan: result.result, plans: result.plans });
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (body === INVALID_JSON) return badRequest(["Request body must be valid JSON."]);

  const id = (body as Record<string, unknown>)?.id;
  if (typeof id !== "string" || !id.trim()) {
    return badRequest(["An `id` is required to update a plan."]);
  }

  const parsed = parsePlan(body);
  if ("errors" in parsed) return badRequest(parsed.errors);

  const result = await updatePlan(parsed.plan);
  if (!result.ok) return badRequest([result.error], 404);

  revalidatePricing();
  return Response.json({ ok: true, plan: result.result, plans: result.plans });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) return badRequest(["An `id` query parameter is required."]);

  const result = await deletePlan(id);
  if (!result.ok) return badRequest([result.error], 404);

  revalidatePricing();
  return Response.json({ ok: true, plans: result.plans });
}
