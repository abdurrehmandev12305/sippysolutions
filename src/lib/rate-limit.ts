import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * File-backed rate limiter — `data/rate-limits.json` is the store, following
 * the same atomic temp-file+rename pattern as `pricing.ts` / `media.ts`.
 *
 * This app deploys to a host with a persistent disk (see README — writes to
 * `data/*.json` require one), not serverless functions, so a single shared
 * file is a correct and durable store here: one Node process, one file, no
 * cross-instance drift. It would NOT be correct on Vercel/serverless, where
 * function instances don't share a filesystem or memory — that deployment
 * would need a shared store like Upstash Redis instead.
 *
 * Policy: fixed window of failures within `windowMs`. Once `maxAttempts` is
 * exceeded, the key is locked out for a duration that doubles on every
 * further attempt made while still locked (capped at `maxLockoutMs`), so
 * continuing to hammer an endpoint makes the wait longer, not shorter.
 */

type Bucket = {
  count: number;
  windowStart: number;
  lockedUntil: number;
  lockoutMs: number;
};

type Store = Record<string, Bucket>;

const FILE = path.join(process.cwd(), "data", "rate-limits.json");
const TEMP_FILE = `${FILE}.tmp`;

async function readStore(): Promise<Store> {
  try {
    const contents = await readFile(FILE, "utf8");
    const parsed = JSON.parse(contents);
    return typeof parsed === "object" && parsed !== null ? (parsed as Store) : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  await writeFile(TEMP_FILE, JSON.stringify(store), "utf8");
  await rename(TEMP_FILE, FILE);
}

/** Serialises reads+writes so concurrent requests can't race the same file. */
let queue: Promise<unknown> = Promise.resolve();

function serialise<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

export type RateLimitPolicy = {
  /** Failures allowed inside `windowMs` before a lockout starts. */
  maxAttempts: number;
  /** Rolling window in which attempts are counted. */
  windowMs: number;
  /** Initial lockout once the limit is exceeded. */
  baseLockoutMs: number;
  /** Lockout doubles on repeated abuse, up to this ceiling. */
  maxLockoutMs: number;
};

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

/**
 * Checks whether `key` is currently locked out — does not consume an
 * attempt. Call this before doing expensive work (e.g. a password hash
 * comparison), then call `recordFailure`/`recordSuccess` afterwards.
 */
export function checkRateLimit(
  bucketName: string,
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const storeKey = `${bucketName}:${key}`;

  return serialise(async () => {
    const store = await readStore();
    const bucket = store[storeKey];
    const now = Date.now();

    if (bucket && bucket.lockedUntil > now) {
      return {
        limited: true as const,
        retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000),
      };
    }

    return { limited: false as const };
  });
}

/** Records a failed attempt, escalating into (or extending) a lockout. */
export function recordFailure(
  bucketName: string,
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const storeKey = `${bucketName}:${key}`;

  return serialise(async () => {
    const store = await readStore();
    const now = Date.now();
    let bucket = store[storeKey];

    // Already locked: being hit again while locked doubles the wait, up to
    // the ceiling, rather than resetting the clock to the same duration.
    if (bucket && bucket.lockedUntil > now) {
      bucket.lockoutMs = Math.min(bucket.lockoutMs * 2, policy.maxLockoutMs);
      bucket.lockedUntil = now + bucket.lockoutMs;
      store[storeKey] = bucket;
      await writeStore(store);
      return {
        limited: true as const,
        retryAfterSeconds: Math.ceil(bucket.lockoutMs / 1000),
      };
    }

    // Window expired (or first attempt): start a fresh count.
    if (!bucket || now - bucket.windowStart > policy.windowMs) {
      bucket = { count: 0, windowStart: now, lockedUntil: 0, lockoutMs: policy.baseLockoutMs };
    }

    bucket.count += 1;

    if (bucket.count > policy.maxAttempts) {
      bucket.lockedUntil = now + bucket.lockoutMs;
      store[storeKey] = bucket;
      await writeStore(store);
      return {
        limited: true as const,
        retryAfterSeconds: Math.ceil(bucket.lockoutMs / 1000),
      };
    }

    store[storeKey] = bucket;
    await writeStore(store);
    return { limited: false as const };
  });
}

/** Clears a key's bucket entirely — call this on a successful login. */
export function recordSuccess(bucketName: string, key: string): Promise<void> {
  const storeKey = `${bucketName}:${key}`;

  return serialise(async () => {
    const store = await readStore();
    if (storeKey in store) {
      delete store[storeKey];
      await writeStore(store);
    }
  });
}
