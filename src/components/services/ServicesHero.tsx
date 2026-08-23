import { Container } from "@/components/ui/Container";

/**
 * "FEATURES" banner at the top of `/services`. Uses the same dark treatment as
 * the About and Contact heroes: night-950 base, faint grid, brand glow.
 */
export function ServicesHero() {
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
          <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            What We Offer
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
