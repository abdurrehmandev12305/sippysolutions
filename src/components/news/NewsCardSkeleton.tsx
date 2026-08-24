/**
 * Placeholder for the `/news` grid, shown while posts stream in from
 * Supabase.
 *
 * Each tile mirrors the real `NewsCard`'s shape — same `aspect-[16/10]` cover
 * box, same `p-6` body with a date line, title and excerpt — so the grid
 * occupies its final height before the data lands and the swap costs no
 * layout shift.
 */

const PLACEHOLDER_COUNT = 4;

function NewsCardSkeletonItem() {
  return (
    <div
      aria-hidden
      className="flex animate-pulse flex-row overflow-hidden rounded-xl border border-night-700 bg-night-900 shadow-card"
    >
      <div className="aspect-[16/10] w-32 shrink-0 bg-white/[0.04] sm:w-40 lg:w-48" />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3 sm:p-4">
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="h-3.5 w-32 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/[0.07]" />
      </div>
    </div>
  );
}

/** The full grid of placeholders, matching the real grid's columns and gap. */
export function NewsGridSkeleton() {
  return (
    <ul
      role="status"
      aria-label="Loading news"
      className="flex flex-col gap-2 sm:gap-3"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <li key={index}>
          <NewsCardSkeletonItem />
        </li>
      ))}
    </ul>
  );
}
