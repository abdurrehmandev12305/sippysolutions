#!/usr/bin/env node
// One-off migration: moves `data/pricing.json` into the `pricing_plans` table,
// and `data/media.json` plus the files under `public/screenshots` and
// `public/videos` into the `media_items` table and the `media` bucket.
//
// Run with `npm run migrate:supabase`, after `supabase/schema.sql` has been
// applied in the Supabase SQL Editor.
//
// Safe to run more than once: a plan whose id is already in the table, or a
// file whose name is already in the gallery, is skipped rather than
// duplicated or overwritten. Nothing local is deleted — the JSON files and
// the public folders are left exactly where they are, so this is reversible
// right up until you remove them by hand.

import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const BUCKET = "media";

/** Mirrors `src/lib/media.ts` — folder per kind, and the kind per extension. */
const FOLDERS = { image: "screenshots", video: "videos" };

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

const KINDS = {
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".mp4": "video",
};

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `\n${name} is not set.\n\n` +
        `Run this through npm so the .env.local values are loaded:\n` +
        `  npm run migrate:supabase\n`,
    );
    process.exit(1);
  }
  return value;
}

const supabase = createClient(
  required("NEXT_PUBLIC_SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/** Reads a JSON file, or returns `fallback` when it isn't there. */
async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(path.join(ROOT, file), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Pricing                                                                     */
/* -------------------------------------------------------------------------- */

async function migratePricing() {
  const { plans = [] } = await readJson("data/pricing.json", { plans: [] });

  if (plans.length === 0) {
    console.log("pricing  · nothing in data/pricing.json, skipping");
    return;
  }

  const { data: existing, error } = await supabase
    .from("pricing_plans")
    .select("id");

  if (error) throw new Error(`couldn't read pricing_plans: ${error.message}`);

  const known = new Set((existing ?? []).map((row) => row.id));
  const rows = plans
    .map((plan, index) => ({
      id: plan.id,
      name: plan.name,
      specs: plan.specs ?? [],
      location: plan.location ?? "",
      flag: plan.flag ?? "",
      currency: plan.currency ?? "€",
      price: plan.price,
      period: plan.period ?? "Per Month",
      // The JSON array order is the display order.
      sort_order: index,
    }))
    .filter((row) => !known.has(row.id));

  if (rows.length === 0) {
    console.log(`pricing  · all ${plans.length} plans already migrated`);
    return;
  }

  const { error: insertError } = await supabase.from("pricing_plans").insert(rows);
  if (insertError) throw new Error(`couldn't insert plans: ${insertError.message}`);

  console.log(
    `pricing  · migrated ${rows.length} plan${rows.length === 1 ? "" : "s"}` +
      (known.size > 0 ? ` (${known.size} already there)` : ""),
  );
}

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The files to migrate, in display order: whatever `data/media.json` lists
 * first, then anything sitting in the folders that the manifest never
 * mentioned, so nothing on disk is silently left behind.
 */
async function collectMedia() {
  const { media = [] } = await readJson("data/media.json", { media: [] });

  const ordered = [...media]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((entry) => entry.file)
    .filter(Boolean);

  const seen = new Set(ordered);
  const files = [...ordered];

  for (const folder of Object.values(FOLDERS)) {
    let names = [];
    try {
      names = await readdir(path.join(ROOT, "public", folder));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      continue;
    }

    for (const name of names.sort()) {
      if (!seen.has(name) && KINDS[path.extname(name).toLowerCase()]) {
        seen.add(name);
        files.push(name);
      }
    }
  }

  return files;
}

async function migrateMedia() {
  const files = await collectMedia();

  if (files.length === 0) {
    console.log("media    · nothing to migrate, skipping");
    return;
  }

  const { data: existing, error } = await supabase.from("media_items").select("file");
  if (error) throw new Error(`couldn't read media_items: ${error.message}`);

  const known = new Set((existing ?? []).map((row) => row.file));

  let order = known.size;
  let migrated = 0;
  const skipped = [];

  for (const file of files) {
    if (known.has(file)) continue;

    const extension = path.extname(file).toLowerCase();
    const type = KINDS[extension];
    if (!type) {
      skipped.push(`${file} (unsupported type)`);
      continue;
    }

    const source = path.join(ROOT, "public", FOLDERS[type], file);

    let body;
    try {
      body = await readFile(source);
    } catch (readError) {
      if (readError.code !== "ENOENT") throw readError;
      skipped.push(`${file} (not on disk)`);
      continue;
    }

    const objectPath = `${FOLDERS[type]}/${file}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, body, {
        contentType: CONTENT_TYPES[extension],
        // An object already in the bucket is left alone; the row below is what
        // was missing, and re-uploading would only churn the CDN copy.
        upsert: false,
      });

    if (uploadError && !/duplicate|already exists|resource already/i.test(uploadError.message)) {
      throw new Error(`couldn't upload ${file}: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    const { error: insertError } = await supabase.from("media_items").insert({
      file,
      url: publicUrl,
      type,
      sort_order: order,
    });

    if (insertError) throw new Error(`couldn't record ${file}: ${insertError.message}`);

    order += 1;
    migrated += 1;
  }

  console.log(
    `media    · migrated ${migrated} file${migrated === 1 ? "" : "s"}` +
      (known.size > 0 ? ` (${known.size} already there)` : ""),
  );

  for (const note of skipped) console.log(`         · skipped ${note}`);
}

/* -------------------------------------------------------------------------- */

try {
  await migratePricing();
  await migrateMedia();
  console.log("\nDone. /pricing and /user-interface now read from Supabase.");
} catch (error) {
  console.error(`\nMigration failed: ${error.message}`);
  process.exitCode = 1;
}
