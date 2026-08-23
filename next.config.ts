import type { NextConfig } from "next";

/**
 * A strict, nonce-based CSP would require forcing every page in the app onto
 * dynamic rendering (Next.js's own CSP guide is explicit about this — nonces
 * only work with dynamic rendering, and static generation/ISR/CDN caching
 * get disabled app-wide). This is a static marketing site; that trade would
 * hurt real users for a hardening step that has a strong static alternative,
 * so this is deliberately the header-based ("without nonces") approach
 * instead — same guide, different section.
 *
 * `'unsafe-inline'` on script-src is the one real compromise: Next.js
 * streams hydration data through inline `<script>` tags, which a strict CSP
 * would otherwise block on every page load. Everything else here is as
 * tight as the app allows, and Tawk.to needs both script-src and connect-src
 * (its widget opens a WebSocket back to its own domains).
 *
 * `'unsafe-eval'` is added in development only — React's Fast Refresh /
 * error-overlay runtime uses `eval` to rebuild readable stack traces, which
 * this exact CSP was observed blocking (EvalError in the browser console)
 * before this was scoped to dev. Production never needs it; neither React
 * nor Next.js call `eval` there.
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * Screenshots, walkthrough videos and the pricing table live in Supabase, so
 * its origin has to be allowed through the CSP: `img-src` and `media-src` for
 * the objects the gallery renders straight from Storage, `connect-src` for the
 * PostgREST calls behind the pricing and gallery reads.
 *
 * Derived from the same env var the app uses rather than hard-coded, so
 * pointing the project at a different Supabase instance can't leave a stale
 * host allowed here. A missing value degrades to the old, tighter policy.
 */
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

const supabaseHost = supabaseOrigin ? new URL(supabaseOrigin).hostname : "";

/** Appended to a directive only when the project URL is configured. */
const supabase = supabaseOrigin ? ` ${supabaseOrigin}` : "";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} blob: https://embed.tawk.to https://cdn.js.tawk.to https://*.tawk.to;
  style-src 'self' 'unsafe-inline' https://cdn.js.tawk.to https://*.tawk.to;
  img-src 'self' data: blob: https://cdn.js.tawk.to https://*.tawk.to${supabase};
  font-src 'self' data: https://cdn.js.tawk.to https://*.tawk.to;
  connect-src 'self' https://cdn.js.tawk.to https://*.tawk.to wss://*.tawk.to${supabase};
  frame-src https://*.tawk.to;
  worker-src 'self' blob: https://cdn.js.tawk.to https://*.tawk.to;
  media-src 'self' https://*.tawk.to${supabase};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Ignored by browsers over plain HTTP, so this is safe to always send —
  // it only takes effect once the site is actually served over HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Nodemailer reaches for Node built-ins (net/tls/dns) and resolves some files
  // dynamically, so it has to be `require`d natively rather than bundled into
  // the route handler.
  serverExternalPackages: ["nodemailer"],
  // The gallery thumbnails on /user-interface go through next/image, which
  // refuses a remote source unless its host is listed here. Scoped to the
  // public object path of the one bucket the app reads.
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/media/**",
          },
        ]
      : [],
    // Gallery objects are effectively immutable: `addMedia` de-duplicates the
    // filename on upload rather than overwriting, so a given URL always names
    // the same bytes, and a delete removes the row that referenced it. Holding
    // the optimised copies for 31 days instead of the 4-hour default therefore
    // costs nothing in staleness and saves re-fetching every screenshot from
    // Storage. Whichever is larger — this or the upstream `Cache-Control` —
    // wins, so Supabase can still ask for longer.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
