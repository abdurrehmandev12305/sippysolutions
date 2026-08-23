import { PricingHero } from "@/components/pricing/PricingHero";
import { PricingGridSkeleton } from "@/components/pricing/PricingCardSkeleton";
import { Container } from "@/components/ui/Container";

/**
 * Navigation fallback for `/pricing`.
 *
 * It reuses the real `PricingHero` and the same grid skeleton the page streams
 * behind its `<Suspense>` boundary, so arriving here from a client-side
 * navigation looks identical to arriving on a cold load — and the swap into
 * the real page costs no layout shift.
 */
export default function Loading() {
  return (
    <>
      <PricingHero />

      <section className="bg-night-900 py-16 sm:py-20">
        <Container>
          <PricingGridSkeleton />
        </Container>
      </section>
    </>
  );
}
