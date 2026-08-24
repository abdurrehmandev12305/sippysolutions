import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";

/**
 * "NEWS" banner at the top of `/news`. Same dark treatment as the Pricing,
 * Services and User Interface heroes: night-950 base, faint grid, brand glow.
 */
export function NewsHero() {
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
            Latest Updates
          </p>

          <h1 className="mt-5 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            News
          </h1>

          <span
            aria-hidden
            className="mx-auto mt-6 block h-1 w-20 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
          />

          <p className="mx-auto mt-7 max-w-2xl text-balance text-sm leading-relaxed text-night-300 sm:text-base">
            Announcements, product updates and news from the {site.name} team.
          </p>
        </div>
      </Container>
    </section>
  );
}
