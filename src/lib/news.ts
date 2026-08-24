import { randomUUID } from "node:crypto";
import path from "node:path";

import { MEDIA_BUCKET, READ_TIMEOUT_MS, supabase } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Read/write access to the `news_posts` table and the cover images it
 * references — together the single source of truth for the public `/news`
 * pages and the admin News Manager.
 *
 * Cover images live in the same `media` bucket the User Interface gallery
 * uses, under a `news/` prefix — the bucket's storage policies aren't scoped
 * to a folder, so nothing new was needed there. Unlike `media_items`, an
 * image here is just a field on a post, not a row of its own: `uploadCoverImage`
 * only writes to Storage and hands back a public URL.
 *
 * Reads use the anon key (the table is world-readable behind RLS). Writes go
 * through the signed-in admin's own session, so the authenticated-only
 * insert/update/delete policies in `supabase/news-migration.sql` are what
 * authorises them — nothing here bypasses RLS.
 *
 * Everything here is server-only: `supabase-server` refuses to load in a
 * Client Component, so this module must never be imported from one either.
 */

export type Post = {
  id: string;
  title: string;
  slug: string;
  /** Short summary shown on the /news grid. */
  excerpt: string;
  /** Plain text, paragraphs separated by a blank line — no markdown. */
  content: string;
  /** Public Supabase Storage URL, or "" when a post has no cover yet. */
  coverImageUrl: string;
  /** ISO 8601 timestamp. */
  publishedAt: string;
};

const TABLE = "news_posts";

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reduces a title (or a hand-typed slug) to something safe for a URL segment:
 * lowercase, hyphen-separated, no leading/trailing hyphens.
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Accepts whatever an admin's date input or an ISO string sends and returns a
 * valid ISO timestamp. Missing or unparsable input defaults to "now" rather
 * than failing the whole save — a blank publish date is not worth blocking on.
 */
function asPublishedAt(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Validates an untrusted post payload and normalises it. `id` is preserved
 * when present so the same parser serves both "create" and "update"; a slug
 * left blank falls back to one derived from the title.
 */
export function parsePost(
  body: unknown,
): { post: Post } | { errors: string[] } {
  if (typeof body !== "object" || body === null) {
    return { errors: ["Post must be a JSON object."] };
  }

  const raw = body as Record<string, unknown>;
  const errors: string[] = [];

  const title = asTrimmedString(raw.title);
  if (!title) errors.push("Title is required.");

  const slug = slugify(asTrimmedString(raw.slug) || title);
  if (!slug) errors.push("Slug is required.");

  if (errors.length > 0) return { errors };

  return {
    post: {
      id: asTrimmedString(raw.id) || randomUUID(),
      title,
      slug,
      excerpt: asTrimmedString(raw.excerpt),
      content: asTrimmedString(raw.content),
      coverImageUrl: asTrimmedString(raw.coverImageUrl),
      publishedAt: asPublishedAt(raw.publishedAt),
    },
  };
}

/** Maps a raw `news_posts` row onto {@link Post}. `null` if a required field is missing. */
function fromRow(row: unknown): Post | null {
  if (typeof row !== "object" || row === null) return null;

  const raw = row as Record<string, unknown>;
  const id = asTrimmedString(raw.id);
  const title = asTrimmedString(raw.title);
  const slug = asTrimmedString(raw.slug);

  if (!id || !title || !slug) return null;

  return {
    id,
    title,
    slug,
    excerpt: asTrimmedString(raw.excerpt),
    content: asTrimmedString(raw.content),
    coverImageUrl: asTrimmedString(raw.cover_image_url),
    publishedAt: asPublishedAt(raw.published_at),
  };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/** Everything the /news grid renders — `content` is left out, it's never shown there. */
const SUMMARY_COLUMNS = "id, title, slug, excerpt, cover_image_url, published_at";
const FULL_COLUMNS = `${SUMMARY_COLUMNS}, content`;

/**
 * Reads every post, newest first. A row that fails validation is skipped
 * rather than thrown on, so one bad hand-edit in the Supabase table editor
 * can't take the public page down.
 *
 * Nothing in here throws. Every failure — a query error, a missing env var, a
 * connection that never answers — comes back as an empty list, because the
 * caller already renders a "nothing published yet" state for that and a
 * visitor should get it instead of an error page.
 */
export async function readPosts(): Promise<Post[]> {
  try {
    const { data, error } = await supabase()
      .from(TABLE)
      .select(SUMMARY_COLUMNS)
      .order("published_at", { ascending: false })
      // Bounded so a Supabase cold start or a network stall can't hold the
      // page's streaming boundary open indefinitely.
      .abortSignal(AbortSignal.timeout(READ_TIMEOUT_MS));

    if (error) {
      console.error(`[news] couldn't read ${TABLE}: ${error.message}`);
      return [];
    }

    return (data ?? []).flatMap((row) => {
      const post = fromRow(row);
      return post ? [post] : [];
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    console.error(`[news] couldn't reach ${TABLE}: ${reason}`);
    return [];
  }
}

/** Reads one post by slug, with its full content. `null` if it doesn't exist or a read fails. */
export async function readPostBySlug(slug: string): Promise<Post | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  try {
    const { data, error } = await supabase()
      .from(TABLE)
      .select(FULL_COLUMNS)
      .eq("slug", trimmed)
      .abortSignal(AbortSignal.timeout(READ_TIMEOUT_MS))
      .maybeSingle();

    if (error) {
      console.error(`[news] couldn't read "${trimmed}": ${error.message}`);
      return null;
    }

    return data ? fromRow(data) : null;
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    console.error(`[news] couldn't reach ${TABLE}: ${reason}`);
    return null;
  }
}

/**
 * Reads one post by id, admin-side only (uses the signed-in session, not the
 * anon client) — for looking up a post's current slug before an update or
 * delete changes or removes it, so the caller can revalidate the old page too.
 */
export async function readPostById(id: string): Promise<Post | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const { data, error } = await (await supabaseServer())
    .from(TABLE)
    .select(SUMMARY_COLUMNS)
    .eq("id", trimmed)
    .maybeSingle();

  if (error) {
    console.error(`[news] couldn't look up ${trimmed}: ${error.message}`);
    return null;
  }

  return data ? fromRow(data) : null;
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

/** Postgres unique-violation — the slug is already taken. */
const UNIQUE_VIOLATION = "23505";

type Outcome<T> =
  | { ok: true; posts: Post[]; result: T }
  | { ok: false; error: string };

/** Answers a successful write with the full, freshly read list. */
async function succeed<T>(result: T): Promise<Outcome<T>> {
  return { ok: true, posts: await readPosts(), result };
}

/** Maps a validated post onto its table row. `id` is set only on insert. */
function toRow(post: Post): Record<string, unknown> {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    cover_image_url: post.coverImageUrl,
    published_at: post.publishedAt,
  };
}

export async function createPost(post: Post): Promise<Outcome<Post>> {
  const { error } = await (await supabaseServer())
    .from(TABLE)
    .insert({ ...toRow(post), id: post.id });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "A post with that slug already exists." };
    }

    console.error(`[news] couldn't create a post: ${error.message}`);
    return { ok: false, error: "Couldn't save that post. Please try again." };
  }

  return succeed(post);
}

export async function updatePost(post: Post): Promise<Outcome<Post>> {
  const { data, error } = await (await supabaseServer())
    .from(TABLE)
    .update(toRow(post))
    .eq("id", post.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "A post with that slug already exists." };
    }

    console.error(`[news] couldn't update ${post.id}: ${error.message}`);
    return { ok: false, error: "Couldn't save that post. Please try again." };
  }

  if (!data) return { ok: false, error: "That post no longer exists." };

  return succeed(post);
}

/**
 * Picks the `news/…` object path out of one of this project's own public
 * Storage URLs. `null` for anything else — an empty cover, or a URL that
 * doesn't match — so a delete never tries to remove something it didn't own.
 */
function newsObjectPath(url: string): string | null {
  const marker = "/storage/v1/object/public/media/";
  const index = url.indexOf(marker);
  if (index === -1) return null;

  const path = url.slice(index + marker.length);
  return path.startsWith("news/") ? decodeURIComponent(path) : null;
}

/**
 * Removes a post and, best-effort, its cover image object. Already gone from
 * the bucket is not a failure — the row is what the site renders, and it has
 * just been removed either way.
 */
export async function deletePost(id: string): Promise<Outcome<string>> {
  const db = await supabaseServer();

  const { data, error } = await db
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id, cover_image_url")
    .maybeSingle();

  if (error) {
    console.error(`[news] couldn't delete ${id}: ${error.message}`);
    return { ok: false, error: "Couldn't delete that post. Please try again." };
  }

  if (!data) return { ok: false, error: "That post no longer exists." };

  const coverUrl = asTrimmedString((data as { cover_image_url?: string }).cover_image_url);
  const objectPath = coverUrl ? newsObjectPath(coverUrl) : null;

  if (objectPath) {
    const { error: removeError } = await db.storage.from(MEDIA_BUCKET).remove([objectPath]);
    if (removeError) {
      console.error(
        `[news] row for ${id} is gone but its cover image isn't: ${removeError.message}`,
      );
    }
  }

  return succeed(id);
}

/* -------------------------------------------------------------------------- */
/* Cover image upload                                                         */
/* -------------------------------------------------------------------------- */

export type UploadCandidate = {
  /** Name as the browser reported it — treated as untrusted. */
  name: string;
  size: number;
  bytes: () => Promise<ArrayBuffer>;
};

/** Content types the bucket accepts, keyed by extension. Images only. */
const UPLOADABLE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export const ACCEPT_ATTRIBUTE = Object.keys(UPLOADABLE).join(",");

/**
 * `request.formData()` buffers the whole upload in memory, so this cap is
 * about protecting the server as much as the bucket.
 */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Reduces an uploaded name to something safe to join onto a path: no
 * directories, no traversal, no characters that need escaping in a URL.
 */
function safeStem(original: string): string {
  const base = path.basename(original).replace(/\.[^.]+$/, "");

  const stem = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return stem || "cover";
}

/** Supabase Storage's "that object name is taken" signal. */
function isDuplicate(error: { message?: string; statusCode?: string }): boolean {
  return (
    (error as { statusCode?: string }).statusCode === "409" ||
    /duplicate|already exists|resource already/i.test(error.message ?? "")
  );
}

/**
 * Uploads a cover image into `news/` in the shared `media` bucket and hands
 * back its public URL. Unlike `addMedia` in `lib/media.ts`, nothing is
 * written to a table here — the caller is responsible for putting the URL on
 * a post. The name is sanitised and de-duplicated the same way.
 */
export async function uploadCoverImage(
  upload: UploadCandidate,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const extension = path.extname(upload.name).toLowerCase();
  const contentType = UPLOADABLE[extension];

  if (!contentType) {
    return {
      ok: false,
      error: `“${upload.name}” isn't a supported file type. Use ${ACCEPT_ATTRIBUTE}.`,
    };
  }

  if (upload.size <= 0) {
    return { ok: false, error: `“${upload.name}” is empty.` };
  }

  if (upload.size > MAX_BYTES) {
    const limit = Math.round(MAX_BYTES / (1024 * 1024));
    return { ok: false, error: `“${upload.name}” is over the ${limit} MB limit.` };
  }

  const db = await supabaseServer();
  const bucket = db.storage.from(MEDIA_BUCKET);
  const stem = safeStem(upload.name);
  const body = await upload.bytes();

  // `upsert: false` makes Storage reject a name that is taken, which both
  // prevents an overwrite and closes the gap between "does it exist" and
  // "write it".
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const file =
      attempt === 0 ? `${stem}${extension}` : `${stem}-${attempt + 1}${extension}`;
    const objectPath = `news/${file}`;

    const { error } = await bucket.upload(objectPath, body, {
      contentType,
      upsert: false,
    });

    if (error) {
      if (isDuplicate(error)) continue;

      console.error(`[news] couldn't upload ${file}: ${error.message}`);
      return {
        ok: false,
        error: `Couldn't upload “${upload.name}”. Please try again.`,
      };
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(objectPath);

    return { ok: true, url: publicUrl };
  }

  return {
    ok: false,
    error: `Couldn't find a free filename for “${upload.name}”.`,
  };
}
