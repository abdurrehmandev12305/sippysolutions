import type { NextRequest } from "next/server";

import { currentAdmin } from "@/lib/supabase-server";
import { forbiddenOrigin, isSameOrigin } from "@/lib/csrf";
import { uploadCoverImage } from "@/lib/news";

/**
 * News cover-image upload endpoint. Writes into `news/` inside the shared
 * `media` bucket and hands back a public URL — nothing is written to a table
 * here, unlike `/api/admin/media`. The caller (the News Manager) puts the
 * returned URL on a post via `/api/admin/news`.
 *
 *   POST  upload one file (multipart form-data, a single `file` part)
 *
 * Requires an admin session, the same check every other admin endpoint
 * applies.
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
 * `request.formData()` buffers the entire body before any per-file size
 * check runs, so a request whose *declared* length is already absurd is
 * rejected up front rather than fully read into memory first.
 */
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

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

  const file = form.get("file");
  if (!(file instanceof File)) return badRequest(["No file was attached."]);

  const result = await uploadCoverImage({
    name: file.name,
    size: file.size,
    bytes: () => file.arrayBuffer(),
  });

  if (!result.ok) return badRequest([result.error]);

  return Response.json({ ok: true, url: result.url });
}
