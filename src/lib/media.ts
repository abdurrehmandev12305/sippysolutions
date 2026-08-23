import path from "node:path";

import { site } from "@/lib/site";
import { MEDIA_BUCKET, READ_TIMEOUT_MS, supabase } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Read/write access to the `media_items` table and the `media` storage bucket
 * — together the single source of truth for the public `/user-interface`
 * gallery and the admin User Interface Manager.
 *
 * The table owns the gallery: an object sitting in the bucket that has no row
 * here is not shown. Uploads and deletes go through this module so the bucket
 * and the table can never drift apart.
 *
 * Reads use the anon key (the table is world-readable behind RLS, and the
 * bucket is public). Writes — table rows and bucket objects alike — go through
 * the signed-in admin's own session, so the authenticated-only policies in
 * `supabase/auth-migration.sql` are what authorises them; nothing here
 * bypasses RLS. Everything is server-only: `supabase-server` refuses to load
 * in a Client Component, so this module must never be imported from one.
 */

/**
 * The gallery is images only. This stays a named type rather than becoming an
 * inline `"image"` because the `media_items.type` column still exists and
 * still round-trips — narrowing it here is what makes the compiler reject any
 * attempt to reintroduce another kind without going through this module.
 */
export type MediaKind = "image";

/** One row of `media_items`, as the app uses it. */
export type MediaEntry = {
  /**
   * Object name inside its kind's folder in the bucket, e.g. `s1.png`. Unique
   * across the table, because it doubles as the handle the dashboard sends
   * back to delete and reorder.
   */
  file: string;
  type: MediaKind;
  /** Display position, always rewritten as 0…n-1 on read. */
  order: number;
};

/** An entry plus the fields the pages actually render. */
export type MediaItem = MediaEntry & {
  /** Public Supabase Storage URL for the object. */
  src: string;
  alt: string;
};

/** Where images live inside the bucket — the old `public/` layout, kept. */
const FOLDERS: Record<MediaKind, string> = {
  image: "screenshots",
};

/** Extensions an admin may upload. Images only — no video formats. */
const UPLOADABLE: Record<string, MediaKind> = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
};

/** Content types the bucket accepts, keyed by extension. */
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * `request.formData()` buffers the whole upload in memory, so this cap is
 * about protecting the server as much as the bucket.
 */
const MAX_BYTES = 10 * 1024 * 1024;

export const ACCEPT_ATTRIBUTE = Object.keys(UPLOADABLE).join(",");

const TABLE = "media_items";

/** Path of an object inside the bucket, e.g. `screenshots/s1.png`. */
function storagePath(entry: Pick<MediaEntry, "file" | "type">): string {
  return `${FOLDERS[entry.type]}/${entry.file}`;
}

/* -------------------------------------------------------------------------- */
/* Filenames                                                                   */
/* -------------------------------------------------------------------------- */

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

  return stem || "upload";
}

/** `s3` / `screenshot-3` / `img_3` carry no meaning — anything else probably does. */
const GENERIC_NAME = /^(?:s|screenshot|shot|img|image|capture)?[\s-]*\d+$/i;

function describe(filename: string, position: number): string {
  const label = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return GENERIC_NAME.test(label)
    ? `${site.name} interface — screenshot ${position}`
    : `${site.name} interface — ${label}`;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

function asKind(value: unknown): MediaKind | null {
  return value === "image" ? value : null;
}

/**
 * Validates one untrusted table row. A `file` containing a path separator is
 * rejected outright rather than sanitised — a hand-edited row is not a place
 * to guess at intent.
 */
function parseRow(
  value: unknown,
  order: number,
): (MediaEntry & { url: string }) | null {
  if (typeof value !== "object" || value === null) return null;

  const raw = value as Record<string, unknown>;
  const file = typeof raw.file === "string" ? raw.file.trim() : "";
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const type = asKind(raw.type);

  if (!file || !type || !url) return null;
  if (file !== path.basename(file) || file.startsWith(".")) return null;
  if (UPLOADABLE[path.extname(file).toLowerCase()] !== type) return null;

  return { file, type, order, url };
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                     */
/* -------------------------------------------------------------------------- */

/** The columns the app renders — the timestamps stay in the database. */
const COLUMNS = "file, url, type, sort_order";

/**
 * Reads the gallery in display order. A read failure yields an empty list
 * rather than an exception, and rows that fail validation are dropped, so a
 * bad hand-edit leaves a gap instead of a broken page.
 *
 * Unlike the filesystem version this does not check that each object really
 * exists in the bucket — that would mean a network round trip per item on
 * every page render. The table is the source of truth, and both writers below
 * keep it in step with the bucket.
 *
 * Nothing in here throws. Every failure — a query error, a missing env var, a
 * connection that never answers — comes back as an empty gallery, because the
 * caller already renders a "nothing published yet" state for that and a
 * visitor should get it instead of an error page.
 */
export async function readMedia(): Promise<MediaItem[]> {
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
      console.error(`[media] couldn't read ${TABLE}: ${error.message}`);
      return [];
    }

    // Renumber on the way out, so rows with gaps or duplicate positions still
    // land on a clean 0…n-1 sequence.
    return (data ?? []).flatMap((row, index) => {
      const parsed = parseRow(row, index);
      if (!parsed) return [];

      return [
        {
          file: parsed.file,
          type: parsed.type,
          order: index,
          src: parsed.url,
          alt: describe(parsed.file, index + 1),
        },
      ];
    });
  } catch (cause) {
    // Two things reject rather than returning `{ error }`: `supabase()` itself,
    // which throws when its env vars are unset, and the fetch underneath, which
    // rejects on an abort or a refused connection. Both used to escape this
    // function and turn the whole route into a 500.
    const reason = cause instanceof Error ? cause.message : String(cause);
    console.error(`[media] couldn't reach ${TABLE}: ${reason}`);
    return [];
  }
}

type Outcome<T> =
  | { ok: true; media: MediaItem[]; result: T }
  | { ok: false; error: string };

/** Answers a successful write with the full, freshly read gallery. */
async function succeed<T>(result: T): Promise<Outcome<T>> {
  return { ok: true, media: await readMedia(), result };
}

/* -------------------------------------------------------------------------- */
/* Operations                                                                  */
/* -------------------------------------------------------------------------- */

export type UploadCandidate = {
  /** Name as the browser reported it — treated as untrusted. */
  name: string;
  size: number;
  bytes: () => Promise<ArrayBuffer>;
};

/** Supabase Storage's "that object name is taken" signal. */
function isDuplicate(error: { message?: string; statusCode?: string }): boolean {
  return (
    (error as { statusCode?: string }).statusCode === "409" ||
    /duplicate|already exists|resource already/i.test(error.message ?? "")
  );
}

/** Postgres unique-violation — the filename is already in the table. */
const UNIQUE_VIOLATION = "23505";

/**
 * Uploads one file into its kind's folder in the bucket and appends a row for
 * it. The name is sanitised and de-duplicated, so an upload can never
 * overwrite a file that is already in the gallery.
 */
export async function addMedia(
  upload: UploadCandidate,
): Promise<Outcome<MediaItem>> {
  const extension = path.extname(upload.name).toLowerCase();
  const type = UPLOADABLE[extension];

  if (!type) {
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
  // "write it" — the same guarantee the old `wx` open flag gave.
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const file =
      attempt === 0 ? `${stem}${extension}` : `${stem}-${attempt + 1}${extension}`;

    const { error } = await bucket.upload(storagePath({ file, type }), body, {
      contentType: CONTENT_TYPES[extension],
      upsert: false,
    });

    if (error) {
      if (isDuplicate(error)) continue;

      console.error(`[media] couldn't upload ${file}: ${error.message}`);
      return {
        ok: false,
        error: `Couldn't upload “${upload.name}”. Please try again.`,
      };
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(storagePath({ file, type }));

    const { error: insertError } = await db.from(TABLE).insert({
      file,
      url: publicUrl,
      type,
      sort_order: await nextSortOrder(),
    });

    if (insertError) {
      // The object landed but the row didn't, so drop the object again rather
      // than leave the bucket holding something the gallery can never show.
      await bucket.remove([storagePath({ file, type })]);

      const clash = insertError.code === UNIQUE_VIOLATION;
      if (!clash) {
        console.error(`[media] couldn't record ${file}: ${insertError.message}`);
      }

      return {
        ok: false,
        error: clash
          ? `“${upload.name}” is already in the gallery.`
          : `Couldn't upload “${upload.name}”. Please try again.`,
      };
    }

    // Re-read rather than hand-building the item, so its `order` and `alt`
    // are the ones the gallery will actually render.
    const media = await readMedia();
    const item = media.find((entry) => entry.file === file);

    return {
      ok: true,
      media,
      result: item ?? {
        file,
        type,
        order: media.length,
        src: publicUrl,
        alt: describe(file, media.length + 1),
      },
    };
  }

  return {
    ok: false,
    error: `Couldn't find a free filename for “${upload.name}”.`,
  };
}

/** Appends after the current last item. */
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

/** Removes an item from the table and deletes the object from the bucket. */
export async function deleteMedia(file: string): Promise<Outcome<string>> {
  const db = await supabaseServer();

  const { data, error } = await db
    .from(TABLE)
    .delete()
    .eq("file", file)
    .select("file, type")
    .maybeSingle();

  if (error) {
    console.error(`[media] couldn't delete ${file}: ${error.message}`);
    return { ok: false, error: "Couldn't delete that file. Please try again." };
  }

  if (!data) return { ok: false, error: "That file is no longer in the gallery." };

  const row = data as { file: string; type: MediaKind };

  // Already gone from the bucket is not a failure — the row is what the
  // gallery renders, and it has just been removed either way.
  const { error: removeError } = await db.storage
    .from(MEDIA_BUCKET)
    .remove([storagePath(row)]);

  if (removeError) {
    console.error(`[media] row for ${file} is gone but the object isn't: ${removeError.message}`);
  }

  return succeed(file);
}

/**
 * Re-sorts the gallery to match `order`. The list must name exactly the files
 * already in the table — a partial list would silently drop the rest.
 */
export async function reorderMedia(order: string[]): Promise<Outcome<string[]>> {
  const unique = new Set(order);
  if (unique.size !== order.length) {
    return { ok: false, error: "The new order lists the same file twice." };
  }

  const current = await readMedia();
  if (unique.size !== current.length) {
    return { ok: false, error: "The new order must list every file exactly once." };
  }

  const known = new Set(current.map((item) => item.file));
  for (const file of order) {
    if (!known.has(file)) {
      return { ok: false, error: `“${file}” is not in the gallery.` };
    }
  }

  const db = await supabaseServer();

  // One statement per row. Postgres has no batched "set each of these to a
  // different value" over PostgREST, and a gallery is a few dozen rows at
  // most — but a partial failure is still reported rather than swallowed,
  // and `readMedia` renumbers on the way out so the page stays coherent.
  const results = await Promise.all(
    order.map((file, sortOrder) =>
      db.from(TABLE).update({ sort_order: sortOrder }).eq("file", file),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error(`[media] couldn't save the new order: ${failed.error.message}`);
    return { ok: false, error: "Couldn't save the new order. Please try again." };
  }

  return succeed(order);
}
