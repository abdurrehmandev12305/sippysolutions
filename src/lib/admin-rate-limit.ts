import { recordFailure, type RateLimitPolicy } from "@/lib/rate-limit";

/**
 * Rate limiting for the `/api/admin/*` write routes, on top of the session
 * check every one of them already does.
 *
 * Keyed by admin user id, not IP: the caller is already authenticated by the
 * time this runs, so the id is trustworthy and — unlike IP — stays meaningful
 * if an admin is behind a shared/rotating address. This bounds what a single
 * compromised session (stolen cookie, XSS) or a misbehaving script can do,
 * same defense-in-depth purpose as the login and contact-form limiters in
 * `@/lib/rate-limit`, which this reuses.
 *
 * Every call consumes one unit regardless of outcome — same convention the
 * contact form uses — so this is really "N writes per window," not "N
 * failures."
 */

/** Cheap JSON/metadata writes: pricing & news CRUD, media reorder/delete. */
export const ADMIN_WRITE_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 40,
  windowMs: 5 * 60 * 1000,
  baseLockoutMs: 60 * 1000,
  maxLockoutMs: 10 * 60 * 1000,
};

/** File uploads: media gallery uploads, news cover-image uploads. */
export const ADMIN_UPLOAD_RATE_LIMIT: RateLimitPolicy = {
  maxAttempts: 20,
  windowMs: 10 * 60 * 1000,
  baseLockoutMs: 60 * 1000,
  maxLockoutMs: 15 * 60 * 1000,
};

function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { ok: false, errors: ["Too many requests. Please slow down and try again shortly."] },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/** Returns a 429 Response if `adminId` has exceeded `policy` on `bucketName`, else `null`. */
export async function adminRateLimited(
  bucketName: string,
  adminId: string,
  policy: RateLimitPolicy,
): Promise<Response | null> {
  const result = await recordFailure(bucketName, adminId, policy);
  return result.limited ? tooManyRequests(result.retryAfterSeconds) : null;
}
