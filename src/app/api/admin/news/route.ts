import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { currentAdmin } from "@/lib/supabase-server";
import { forbiddenOrigin, isSameOrigin } from "@/lib/csrf";
import { ADMIN_WRITE_RATE_LIMIT, adminRateLimited } from "@/lib/admin-rate-limit";
import {
  createPost,
  deletePost,
  parsePost,
  readPostById,
  readPosts,
  updatePost,
} from "@/lib/news";

/**
 * News Manager endpoint — the Supabase `news_posts` table is the store.
 *
 *   GET     list every post
 *   POST    create a post (body: post without `id`)
 *   PUT     replace a post (body: post with `id`)
 *   DELETE  remove a post (`?id=…`)
 *
 * Every method requires an admin session. Each write answers with the full
 * updated list, so the dashboard never has to guess at the new state.
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
 * Drops the cached `/news` grid and one post's detail page after a write.
 *
 * Both are prerendered with `revalidate = 30`, so without this a change made
 * here would take up to half a minute to reach visitors. From a Route Handler
 * this marks the paths rather than rebuilding them on the spot: the next
 * request for either renders fresh and repopulates the cache, so the admin's
 * change is live on the next visit instead of on the next timer tick.
 *
 * The dashboard's own view doesn't depend on this — it renders per request and
 * each write already answers with the full updated list.
 */
function revalidateNews(slug?: string) {
  revalidatePath("/news");
  if (slug) revalidatePath(`/news/${slug}`);
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

  return Response.json({ ok: true, posts: await readPosts() });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const admin = await requireAdmin();
  if ("denied" in admin) return admin.denied;

  const limited = await adminRateLimited("admin-news", admin.user.id, ADMIN_WRITE_RATE_LIMIT);
  if (limited) return limited;

  const body = await readJsonBody(request);
  if (body === INVALID_JSON) return badRequest(["Request body must be valid JSON."]);

  // A create always mints a fresh id, so a client-supplied one is ignored.
  const parsed = parsePost({ ...(body as object), id: undefined });
  if ("errors" in parsed) return badRequest(parsed.errors);

  const result = await createPost(parsed.post);
  if (!result.ok) return badRequest([result.error], 409);

  revalidateNews(parsed.post.slug);
  return Response.json({ ok: true, post: result.result, posts: result.posts });
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const admin = await requireAdmin();
  if ("denied" in admin) return admin.denied;

  const limited = await adminRateLimited("admin-news", admin.user.id, ADMIN_WRITE_RATE_LIMIT);
  if (limited) return limited;

  const body = await readJsonBody(request);
  if (body === INVALID_JSON) return badRequest(["Request body must be valid JSON."]);

  const id = (body as Record<string, unknown>)?.id;
  if (typeof id !== "string" || !id.trim()) {
    return badRequest(["An `id` is required to update a post."]);
  }

  const parsed = parsePost(body);
  if ("errors" in parsed) return badRequest(parsed.errors);

  // Read the slug as it stands before the write, so a rename can revalidate
  // the page it's leaving behind as well as the one it's moving to.
  const previous = await readPostById(parsed.post.id);

  const result = await updatePost(parsed.post);
  if (!result.ok) return badRequest([result.error], 404);

  revalidateNews(parsed.post.slug);
  if (previous && previous.slug !== parsed.post.slug) {
    revalidatePath(`/news/${previous.slug}`);
  }

  return Response.json({ ok: true, post: result.result, posts: result.posts });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const admin = await requireAdmin();
  if ("denied" in admin) return admin.denied;

  const limited = await adminRateLimited("admin-news", admin.user.id, ADMIN_WRITE_RATE_LIMIT);
  if (limited) return limited;

  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) return badRequest(["An `id` query parameter is required."]);

  const previous = await readPostById(id);

  const result = await deletePost(id);
  if (!result.ok) return badRequest([result.error], 404);

  revalidateNews(previous?.slug);
  return Response.json({ ok: true, posts: result.posts });
}
