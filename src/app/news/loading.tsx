import { NewsHero } from "@/components/news/NewsHero";
import { NewsGridSkeleton } from "@/components/news/NewsCardSkeleton";
import { Container } from "@/components/ui/Container";

/**
 * Navigation fallback for `/news`.
 *
 * It reuses the real `NewsHero` and the same grid skeleton the page streams
 * behind its `<Suspense>` boundary, so arriving here from a client-side
 * navigation looks identical to arriving on a cold load — and the swap into
 * the real page costs no layout shift.
 */
export default function Loading() {
  return (
    <>
      <NewsHero />

      <section className="bg-night-950 pb-20 sm:pb-24">
        <Container>
          <NewsGridSkeleton />
        </Container>
      </section>
    </>
  );
}
