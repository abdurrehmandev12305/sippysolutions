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
    <section className="bg-night-950 pb-20 sm:pb-24">
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
                className="block w-full overflow-hidden rounded-2xl border border-night-700 bg-night-900 shadow-card"
              >
                <div className="aspect-[16/10] w-full animate-pulse bg-white/[0.04]" />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
