# Sippy Solution — Marketing Site

Next.js (App Router) + React + Tailwind CSS v4 + Three.js marketing site for a
VoIP softswitch / class 4-5 / dedicated server business.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also runs a type check)
npm run typecheck  # types only
```

## What's built

| Route    | File                    | Sections                                          |
| -------- | ----------------------- | ------------------------------------------------- |
| `/`      | `src/app/page.tsx`      | Hero (Three.js background) · Services · Why We Are? |
| `/about` | `src/app/about/page.tsx`| About Us · Privacy Policy / Rent a Server / Payment Method accordions |
| `/services` | `src/app/services/page.tsx` | Features hero · animated feature sections   |
| `/pricing`  | `src/app/pricing/page.tsx`  | Pricing hero · plan cards · custom-quote CTA |
| `/contact`  | `src/app/contact/page.tsx`  | Contact form (posts to `/api/contact`)      |

Every route in the Navbar and Footer is built; `src/app/not-found.tsx` is the
branded 404 for anything else.

## Pricing & the admin panel

Plans on `/pricing` are **not** hard-coded — they're read from
`data/pricing.json` on every request, so an edit in the admin panel shows up on
the public page immediately with no rebuild.

| Route              | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `/admin/login`     | Email + password form (Supabase Auth)                    |
| `/admin/dashboard` | Pricing Manager — add / edit / delete plans, and log out |
| `/api/admin/pricing` | `GET` list · `POST` create · `PUT` update · `DELETE` remove |

Operator accounts live in Supabase (Dashboard → Authentication → Users), not in
`.env.local` — there is no admin email, password hash or session secret to
configure. Sign-in is `signInWithPassword`; the session is the cookie pair
`@supabase/ssr` writes. To check a sign-in from the terminal without a browser,
run `npm run verify:supabase-login`.

Two layers guard the dashboard: `src/proxy.ts` refreshes the Supabase session
and bounces requests with no valid user (Next.js 16 renamed Middleware to
Proxy), and `src/app/admin/dashboard/layout.tsx` calls `currentAdmin()` — that
second check is the real authorisation boundary. Both use `getUser()`, which
revalidates the JWT, never `getSession()`, which only trusts the cookie. Every
method on `/api/admin/*` verifies the session independently.

Writes are not privileged server-side: `src/lib/supabase-server.ts` builds a
client on the **anon** key carrying the admin's own session, so the
authenticated-only RLS policies in `supabase/auth-migration.sql` are what
actually authorise every insert, update and delete — including uploads to the
`media` bucket. Login is additionally rate-limited by IP (`src/lib/rate-limit.ts`,
shared with the contact form).

> **Deploying:** the rate limiter keeps its state in Upstash Redis when
> `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set (Vercel KV's
> `KV_REST_API_URL` / `KV_REST_API_TOKEN` work too — same service, and linking
> the store in Vercel injects them for you). Without them it falls back to an
> in-memory map, which is right for `next dev` and for a single-process host,
> but on serverless only limits within one warm instance — so configure the
> Redis credentials in production. Nothing else writes to the filesystem at
> runtime any more.

## Project layout

```
data/
  pricing.json          Every plan on /pricing — the admin panel writes here
src/
  proxy.ts              Supabase session refresh + gate for /admin/dashboard
  app/
    layout.tsx          Root layout: Navbar + <main> + Footer, metadata template
    page.tsx            Home
    about/page.tsx      About
    services/page.tsx   Services
    pricing/page.tsx    Pricing (reads data/pricing.json per request)
    contact/page.tsx    Contact
    admin/
      actions.ts        "use server" login / logout actions
      login/page.tsx    Admin login
      dashboard/        Protected layout (auth boundary) + Pricing Manager
    api/
      contact/          Contact form endpoint
      admin/pricing/    Pricing CRUD, admin session required
    not-found.tsx       Branded 404
    globals.css         Tailwind import + design tokens (@theme) + base styles
    icon.svg            Favicon
  components/
    layout/             Navbar, Footer  (shared by every page)
    ui/                 Container, SectionHeading, Button/ButtonLink,
                        Accordion, RichText, Reveal
    home/               Hero, Services, WhyWeAre
    about/              AboutIntro, PolicyAccordions, PaymentMethods
    services/           ServicesHero, FeatureSections, ServiceIllustration
    pricing/            PricingHero, PricingCard
    admin/              LoginForm, PricingManager
    three/              NetworkBackground (WebGL), HeroBackground (lazy wrapper)
  content/              Page copy as typed data: services.ts, about.ts
  lib/                  site.ts (nav + contact config), cn.ts,
                        pricing.ts (read/validate/write data/pricing.json)
```

### Content lives in `src/content`

Copy is data, not JSX — edit `src/content/services.ts` or
`src/content/about.ts` and every page/footer that uses it updates. The four
"Why We Are?" cards (`advantages`) are intentionally **placeholder** copy
awaiting the final wording.

### Design tokens

All colours come from `@theme` in `src/app/globals.css`:

- `brand-50 … brand-900` — orange accent (`brand-500` = `#f97316`)
- `night-50 … night-950` — dark navy neutrals (`night-950` = page background)
- helpers: `shadow-glow`, `shadow-card`, `bg-grid`, `animate-fade-up`

Re-skinning the site = changing those values.

## Adding a page (e.g. Services)

1. Create `src/app/services/page.tsx`:

   ```tsx
   import type { Metadata } from "next";
   import { Container } from "@/components/ui/Container";
   import { SectionHeading } from "@/components/ui/SectionHeading";

   export const metadata: Metadata = {
     title: "Services", // becomes "Services | Sippy Solution"
     description: "…",
     alternates: { canonical: "/services" },
   };

   export default function ServicesPage() {
     return (
       <section className="bg-night-950 py-20 sm:py-28">
         <Container>
           <SectionHeading label="What we offer" title="Services" />
           {/* … */}
         </Container>
       </section>
     );
   }
   ```

2. Put its copy in `src/content/<page>.ts`.
3. Nothing to wire up in the Navbar/Footer — both render `navLinks` from
   `src/lib/site.ts`, so the link is already there. (Add new links there.)

The Navbar, Footer, skip link, metadata template and `<main>` wrapper all come
from the root layout, so pages only render their own sections.

## Three.js notes

`src/components/three/NetworkBackground.tsx` renders the animated node/link
mesh in the hero. It is deliberately contained:

- lazy-loaded client-side only via `HeroBackground` (three.js stays out of the
  initial bundle and never runs during SSR),
- one `Points` + one `LineSegments`, ~90 nodes, no post-processing,
- the render loop pauses when the hero scrolls out of view or the tab is hidden,
- `prefers-reduced-motion` gets a single static frame instead of animation,
- falls back to the CSS gradient background if WebGL is unavailable.

Use it only in the hero — adding WebGL to more sections is what kills
performance on this kind of page.
