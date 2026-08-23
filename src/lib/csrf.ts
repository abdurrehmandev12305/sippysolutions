import type { NextRequest } from "next/server";

/**
 * Origin-header CSRF check for cookie-authenticated JSON/form APIs.
 *
 * The session cookie is already `SameSite=Lax`, which stops a cross-site
 * `<form>` POST from carrying it — but this is deliberate defense-in-depth on
 * top of that, per OWASP's "Verifying Origin With Standard Headers" pattern:
 * confirm the request actually originated from this site before touching
 * anything that mutates state. No token to thread through the client, no
 * change to how the dashboard calls these routes.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  // Browsers attach `Origin` to every state-changing fetch/form POST. Its
  // absence here means the request didn't come from a browser context this
  // check can verify — treat that as untrusted rather than assume same-origin.
  if (!origin) return false;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function forbiddenOrigin() {
  return Response.json(
    { ok: false, errors: ["Request rejected: origin verification failed."] },
    { status: 403 },
  );
}
