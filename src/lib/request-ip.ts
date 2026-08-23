/**
 * Best-effort client IP for rate-limiting keys.
 *
 * This app deploys behind exactly one reverse proxy on a VPS/container (see
 * README), which is expected to set `X-Forwarded-For`. Each hop *appends* to
 * that header rather than replacing it, so whatever a client sends itself is
 * always the *first* entry — attacker-controlled on every request. The entry
 * *our* reverse proxy appends is the address it actually saw the connection
 * from, and is always the *last* entry, so that's the one value in a
 * single-hop deployment worth trusting. (A client can send an arbitrarily
 * long fake chain before that; only the last hop matters.)
 *
 * There is no built-in `request.ip` in the App Router — Next.js deliberately
 * leaves this to the hosting layer, since only it knows how many proxy hops
 * to trust. A setup with more hops in front (e.g. a CDN ahead of the reverse
 * proxy) would need to trust further back than the last entry.
 */
/** Anything with readable headers — a `Request`, or `next/headers`' store. */
type HeaderSource = { headers: { get(name: string): string | null } };

export function getClientIp(source: HeaderSource): string {
  const forwardedFor = source.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((hop) => hop.trim()).filter(Boolean);
    const closest = hops.at(-1);
    if (closest) return closest;
  }

  const realIp = source.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
