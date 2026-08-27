import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { currentAdmin } from "@/lib/supabase-server";
import { forbiddenOrigin, isSameOrigin } from "@/lib/csrf";
import { ADMIN_WRITE_RATE_LIMIT, adminRateLimited } from "@/lib/admin-rate-limit";
import { parseDemoAccess, readDemoAccess, updateDemoAccess } from "@/lib/demo-access";

/**
 * Demo Access Manager endpoint — the Supabase `demo_access` table is the
 * store. There is exactly one row, so unlike the pricing/news/media routes
 * this only ever reads or replaces it — no create, no delete.
 *
 *   GET  read the current demo access
 *   PUT  replace it (body: { url, username, password })
 *
 * Every method requires an admin session. The write answers with the saved
 * value, so the dashboard never has to guess at the new state.
 */

/** Guards a handler; returns the signed-in admin, or a 401 response when there's none. */
async function requireAdmin(): Promise<{ user: User } | { denied: Response }> {
  const user = await currentAdmin();
  if (user) return { user };

  return {
    denied: Response.json(
      { ok: false, errors: ["You must be signed in."] },
      { status: 401 },
    ),
  };
}

function badRequest(errors: string[], status = 400) {
  return Response.json({ ok: false, errors }, { status });
}

/**
 * Drops the cached `/user-interface` page after a write.
 *
 * That page is prerendered with `revalidate = 30`, so without this an edit
 * made here would take up to half a minute to reach visitors. From a Route
 * Handler this marks the path rather than rebuilding it on the spot: the
 * next request for `/user-interface` renders fresh and repopulates the
 * cache, so the admin's change is live on the next visit instead of on the
 * next timer tick.
 */
function revalidateUserInterface() {
  revalidatePath("/user-interface");
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
  const admin = await requireAdmin();
  if ("denied" in admin) return admin.denied;

  return Response.json({ ok: true, access: await readDemoAccess() });
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const admin = await requireAdmin();
  if ("denied" in admin) return admin.denied;

  const limited = await adminRateLimited("admin-demo-access", admin.user.id, ADMIN_WRITE_RATE_LIMIT);
  if (limited) return limited;

  const body = await readJsonBody(request);
  if (body === INVALID_JSON) return badRequest(["Request body must be valid JSON."]);

  const parsed = parseDemoAccess(body);
  if ("errors" in parsed) return badRequest(parsed.errors);

  const result = await updateDemoAccess(parsed.access);
  if (!result.ok) return badRequest([result.error], 404);

  revalidateUserInterface();
  return Response.json({ ok: true, access: result.access });
}
