/**
 * IP rate limiter, shared by the contact form and the admin login.
 *
 * The state lives in one of two stores, chosen at runtime from the
 * environment:
 *
 *   - **Upstash Redis** (also Vercel KV, which is Upstash under the
 *     Marketplace integration) when a REST URL + token are configured. State
 *     is shared by every serverless instance and survives cold starts, so a
 *     lockout means the same thing on every invocation. This is what
 *     production should run on.
 *   - **In-memory** otherwise — a plain `Map` inside a single process.
 *     Correct for `next dev` and for any single-process host, and on
 *     serverless it still limits within one warm instance's lifetime; what it
 *     cannot do is stop an attacker whose requests keep landing on fresh
 *     instances.
 *
 * This used to be a JSON file under `data/`, which is why production threw
 * `ENOENT: ... /var/task/data/rate-limits.json`: a serverless filesystem is
 * read-only outside `/tmp`, and `/tmp` is per-instance anyway, so no file
 * there would have been shared either.
 *
 * Policy (unchanged): fixed window of failures within `windowMs`. Once
 * `maxAttempts` is exceeded, the key is locked out for a duration that doubles
 * on every further attempt made while still locked (capped at `maxLockoutMs`),
 * so continuing to hammer an endpoint makes the wait longer, not shorter.
 */

type Bucket = {
  count: number;
  windowStart: number;
  lockedUntil: number;
  lockoutMs: number;
};

/**
 * The storage contract. `set` takes a TTL because every backend has to forget
 * buckets on its own — the old file grew forever and was only ever cleared by
 * hand.
 */
type RateLimitStore = {
  get(key: string): Promise<Bucket | null>;
  set(key: string, bucket: Bucket, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
};

/** Keeps a bucket alive past the window/lockout it describes, never short of it. */
const TTL_SLACK_MS = 60_000;

/** Namespace, so the store can be shared with anything else that needs one. */
const KEY_PREFIX = "rate-limit:";

/**
 * A bucket must outlive both the window it is counting in and the lockout it
 * is serving; `lockoutMs` is in there too so the escalation ladder isn't
 * forgotten the moment a lockout lapses.
 */
function ttlFor(bucket: Bucket, policy: RateLimitPolicy, now: number): number {
  return (
    Math.max(policy.windowMs, bucket.lockedUntil - now, bucket.lockoutMs) +
    TTL_SLACK_MS
  );
}

// --- In-memory store ---------------------------------------------------------

type Entry = { bucket: Bucket; expiresAt: number };

const entries = new Map<string, Entry>();

/** Only walked once the map has grown, so the common path stays O(1). */
const PRUNE_THRESHOLD = 500;

function prune(now: number): void {
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) entries.delete(key);
  }
}

const memoryStore: RateLimitStore = {
  async get(key) {
    const entry = entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return null;
    }
    return entry.bucket;
  },

  async set(key, bucket, ttlMs) {
    const now = Date.now();
    if (entries.size > PRUNE_THRESHOLD) prune(now);
    entries.set(key, { bucket, expiresAt: now + ttlMs });
  },

  async delete(key) {
    entries.delete(key);
  },
};

// --- Upstash Redis store -----------------------------------------------------

/** A slow Redis must not become a slow contact form. */
const REDIS_TIMEOUT_MS = 3_000;

type RedisConfig = { url: string; token: string };

/**
 * Upstash's own variable names first, then the `KV_REST_API_*` aliases the
 * Vercel Marketplace integration injects — the same credentials either way, so
 * linking the store in Vercel is all the configuration this needs.
 */
function redisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

/**
 * One command over the REST API, sent as a JSON array body rather than in the
 * path: keys here contain colons and can be a raw IPv6 address, and the body
 * form needs no escaping.
 */
async function redisCommand(
  config: RedisConfig,
  command: (string | number)[],
): Promise<unknown> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Upstash responded ${response.status}`);
  }

  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error(`Upstash error: ${body.error}`);
  return body.result ?? null;
}

let warnedAboutRedis = false;

/**
 * Degrading to the in-memory store beats both alternatives when Redis is
 * unreachable: failing open would drop the limit entirely, and failing closed
 * would take the contact form down with the cache.
 */
function fallback(operation: string, error: unknown): void {
  if (!warnedAboutRedis) {
    warnedAboutRedis = true;
    console.error(
      `[rate-limit] Redis ${operation} failed — falling back to in-memory limiting on this instance.`,
      error,
    );
  }
}

function redisStore(config: RedisConfig): RateLimitStore {
  return {
    async get(key) {
      try {
        const result = await redisCommand(config, ["GET", key]);
        if (typeof result !== "string") return null;
        const parsed = JSON.parse(result) as unknown;
        return typeof parsed === "object" && parsed !== null
          ? (parsed as Bucket)
          : null;
      } catch (error) {
        fallback("GET", error);
        return memoryStore.get(key);
      }
    },

    async set(key, bucket, ttlMs) {
      try {
        await redisCommand(config, [
          "SET",
          key,
          JSON.stringify(bucket),
          "PX",
          Math.ceil(ttlMs),
        ]);
      } catch (error) {
        fallback("SET", error);
        await memoryStore.set(key, bucket, ttlMs);
      }
    },

    async delete(key) {
      try {
        await redisCommand(config, ["DEL", key]);
      } catch (error) {
        fallback("DEL", error);
        await memoryStore.delete(key);
      }
    },
  };
}

let selected: RateLimitStore | null = null;

/** Resolved once per process, on first use, then reused. */
function store(): RateLimitStore {
  if (selected) return selected;

  const config = redisConfig();
  if (config) {
    selected = redisStore(config);
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] No UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN) set — limits are per-instance and reset on cold starts.",
      );
    }
    selected = memoryStore;
  }

  return selected;
}

/**
 * Serialises reads+writes so concurrent requests in this process can't race
 * the same bucket. Across serverless instances the read-modify-write is not
 * atomic — two instances can read the same count at once — which costs at most
 * an extra attempt or two before the lockout lands, and never lets an
 * already-locked key through.
 */
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
  const storeKey = `${KEY_PREFIX}${bucketName}:${key}`;

  return serialise(async () => {
    const bucket = await store().get(storeKey);
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
  const storeKey = `${KEY_PREFIX}${bucketName}:${key}`;

  return serialise(async () => {
    const backend = store();
    const now = Date.now();
    let bucket = await backend.get(storeKey);

    // Already locked: being hit again while locked doubles the wait, up to
    // the ceiling, rather than resetting the clock to the same duration.
    if (bucket && bucket.lockedUntil > now) {
      bucket.lockoutMs = Math.min(bucket.lockoutMs * 2, policy.maxLockoutMs);
      bucket.lockedUntil = now + bucket.lockoutMs;
      await backend.set(storeKey, bucket, ttlFor(bucket, policy, now));
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
      await backend.set(storeKey, bucket, ttlFor(bucket, policy, now));
      return {
        limited: true as const,
        retryAfterSeconds: Math.ceil(bucket.lockoutMs / 1000),
      };
    }

    await backend.set(storeKey, bucket, ttlFor(bucket, policy, now));
    return { limited: false as const };
  });
}

/** Clears a key's bucket entirely — call this on a successful login. */
export function recordSuccess(bucketName: string, key: string): Promise<void> {
  const storeKey = `${KEY_PREFIX}${bucketName}:${key}`;

  return serialise(async () => {
    await store().delete(storeKey);
  });
}
