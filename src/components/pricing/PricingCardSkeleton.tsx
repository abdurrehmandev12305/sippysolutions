/**
 * Placeholder for the `/pricing` grid, shown while the plans stream in from
 * Supabase.
 *
 * Every box here mirrors the real `PricingCard` — same border, same radius,
 * same `px-6 py-6` header, same four `py-3.5` spec rows, same `p-6 pt-4`
 * button well — so the card occupies its final height before the data lands
 * and the swap costs no layout shift. The bars inside are the only invented
 * geometry, and they are sized to the text they stand in for.
 */

/**
 * Sized to the live catalogue (12 plans), which is four complete rows at
 * `lg:grid-cols-3` and six at `sm:grid-cols-2`. This is the number that decides
 * how much height the placeholder reserves, so a count far below the real one
 * makes the page grow when the plans land — the layout shift this file exists
 * to prevent. A multiple of both column counts keeps the last row full.
 */
const PLACEHOLDER_COUNT = 12;

/** Four spec rows plus the Location row every plan carries. */
const SPEC_ROWS = 5;

function PricingCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-card"
    >
      {/* Stands in for the `text-lg sm:text-xl` plan name — h-7 matches that
          text's 28px line box, so the header reserves the height it will have. */}
      <div className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto h-7 w-3/5 rounded-md bg-white/10" />
      </div>

      <div className="flex-1 divide-y divide-white/[0.06] px-6 py-2">
        {Array.from({ length: SPEC_ROWS }, (_, row) => (
          // h-5 is the 20px line box of the real row's `text-sm`, so each row
          // reserves its final height rather than a few pixels less.
          <div key={row} className="flex items-center justify-between gap-4 py-3.5">
            <div className="h-5 w-1/4 rounded bg-white/[0.07]" />
            <div className="h-5 w-2/5 rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* Same height as the real `py-3.5` enquiry button. */}
      <div className="p-6 pt-4">
        <div className="h-[3.25rem] w-full rounded-xl bg-white/[0.07]" />
      </div>
    </div>
  );
}

/** The full grid of placeholders, matching the real grid's columns and gap. */
export function PricingGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading plans"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <PricingCardSkeleton key={index} />
      ))}
    </div>
  );
}
