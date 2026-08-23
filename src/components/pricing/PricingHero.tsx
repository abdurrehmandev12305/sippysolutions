import { Container } from "@/components/ui/Container";

/**
 * "PRICING" banner at the top of `/pricing` — same dark treatment as the
 * About, Services and Contact heroes.
 */
export function PricingHero() {
  return (
    <section className="relative isolate overflow-hidden bg-night-950 py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-[-8rem] -z-10 size-[28rem] rounded-full bg-brand-600/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-[-10rem] -z-10 size-[24rem] rounded-full bg-brand-500/10 blur-[120px]"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-400 sm:text-sm">
            Plans &amp; Packages
          </p>

          <h1 className="mt-5 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            Pricing
          </h1>

          <span
            aria-hidden
            className="mx-auto mt-6 block h-1 w-20 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
          />
        </div>
      </Container>
    </section>
  );
}
