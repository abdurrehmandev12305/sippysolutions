import { Container } from "@/components/ui/Container";

/**
 * Placeholder for the `/user-interface` grid, shown while the gallery streams
 * in from Supabase.
 *
 * The wrapper repeats `ScreenshotGallery`'s own section padding, container,
 * grid columns and gap, and each tile carries the same `aspect-[16/10]` box as
 * a real thumbnail — so the tiles land exactly where the screenshots will, and
 * the swap costs no layout shift.
 */

/**
 * Sized to the live gallery (10 screenshots) rounded up to complete rows: 12
 * tiles is three full rows at `xl:grid-cols-4` and four at `lg:grid-cols-3`,
 * which is exactly what 10 items occupy at those breakpoints. Reserving fewer
 * rows than the gallery fills would let the page grow when the thumbnails land
 * — the layout shift this file exists to prevent.
 */
const PLACEHOLDER_COUNT = 12;

export function ScreenshotGallerySkeleton() {
  return (
    <section className="relative isolate border-t border-white/[0.05] bg-night-900/25 pt-14 pb-20 sm:pt-16 sm:pb-24">
      {/* Eases the tint out of the hero above, so the band reads as a
          separate surface without a hard seam across the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-night-950 to-transparent"
      />

      {/* Monitor texture — a faint grid with scan lines over it. Both are
          masked back to flat navy at the band's edges so the texture never
          collides with the hero fade above or the footer rule below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-scanlines [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
      />

      <Container>
        <ul
          role="status"
          aria-label="Loading screenshots"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
            <li key={index}>
              <div
                aria-hidden
                className="block w-full rounded-2xl border border-brand-500/30 bg-[#0d0f1a] p-1.5 shadow-screenshot"
              >
                <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600 opacity-70" />
                <div className="mt-1.5 aspect-[16/10] w-full animate-pulse rounded-xl bg-white/[0.04] ring-1 ring-inset ring-brand-400/20" />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
