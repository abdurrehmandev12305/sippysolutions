import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { currentAdmin } from "@/lib/supabase-server";
import { forbiddenOrigin, isSameOrigin } from "@/lib/csrf";
import {
  addMedia,
  deleteMedia,
  readMedia,
  reorderMedia,
  type MediaItem,
} from "@/lib/media";

/**
 * User Interface Manager endpoint — the Supabase `media_items` table is the
 * store, and the images live in the `media` bucket under `screenshots/`.
 *
 *   GET     list every item in display order
 *   POST    upload files (multipart form-data, one or more `file` parts)
 *   PUT     reorder (body: `{ order: string[] }` — every filename, once)
 *   DELETE  remove a file (`?file=…`)
 *
 * Every method requires an admin session, the same check the Pricing Manager
 * endpoint applies. Each write answers with the full updated list, so the
 * dashboard never has to guess at the new state.
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
 * Drops the cached `/user-interface` page after a write.
 *
 * That page is prerendered with `revalidate = 30`, so without this an upload,
 * delete or reorder would take up to half a minute to reach visitors. From a
 * Route Handler this marks the path rather than rebuilding it on the spot: the
 * next request for `/user-interface` renders fresh and repopulates the cache,
 * so the change is live on the next visit instead of on the next timer tick.
 *
 * The dashboard's own view doesn't depend on this — it renders per request and
 * each write already answers with the full updated gallery.
 */
function revalidateGallery() {
  revalidatePath("/user-interface");
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return Response.json({ ok: true, media: await readMedia() });
}

/**
 * `request.formData()` buffers the entire body before any per-file size
 * check runs, so a request whose *declared* length is already absurd is
 * rejected up front rather than fully read into memory first.
 */
const MAX_REQUEST_BYTES = 120 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const denied = await requireAdmin();
  if (denied) return denied;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return badRequest(["Upload is too large."], 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest(["Upload must be sent as multipart form data."]);
  }

  const files = form.getAll("file").filter((part): part is File => part instanceof File);
  if (files.length === 0) return badRequest(["No files were attached."]);

  // Uploads are applied one at a time so a rejected file doesn't discard the
  // ones beside it; every failure is reported, and whatever landed is kept.
  const uploaded: MediaItem[] = [];
  const errors: string[] = [];
  let media = await readMedia();

  for (const file of files) {
    const result = await addMedia({
      name: file.name,
      size: file.size,
      bytes: () => file.arrayBuffer(),
    });

    if (result.ok) {
      uploaded.push(result.result);
      media = result.media;
    } else {
      errors.push(result.error);
    }
  }

  if (uploaded.length === 0) {
    return badRequest(errors.length > 0 ? errors : ["Nothing was uploaded."]);
  }

  // Reached only when at least one file landed, so a batch that failed outright
  // doesn't drop the cache for nothing.
  revalidateGallery();
  return Response.json({ ok: true, uploaded, media, errors });
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  const order = (body as { order?: unknown })?.order;
  if (!Array.isArray(order) || order.some((file) => typeof file !== "string")) {
    return badRequest(["`order` must be a list of filenames."]);
  }

  const result = await reorderMedia(order as string[]);
  if (!result.ok) return badRequest([result.error], 409);

  revalidateGallery();
  return Response.json({ ok: true, media: result.media });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();
  const denied = await requireAdmin();
  if (denied) return denied;

  const file = request.nextUrl.searchParams.get("file")?.trim();
  if (!file) return badRequest(["A `file` query parameter is required."]);

  const result = await deleteMedia(file);
  if (!result.ok) return badRequest([result.error], 404);

  revalidateGallery();
  return Response.json({ ok: true, media: result.media });
}
