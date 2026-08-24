import { Container } from "@/components/ui/Container";

/**
 * Navigation fallback for `/news/[slug]`. The slug isn't known yet at this
 * point, so this mirrors the real page's layout with generic placeholders
 * rather than any specific post's content.
 */
export default function Loading() {
  return (
    <article aria-hidden className="animate-pulse bg-night-950 pb-20 sm:pb-24">
      <div className="border-b border-night-800 bg-night-950 py-16 sm:py-20">
        <Container>
          <div className="h-4 w-24 rounded bg-white/10" />

          <div className="mx-auto mt-8 max-w-3xl text-center">
            <div className="mx-auto h-3 w-32 rounded bg-white/10" />
            <div className="mx-auto mt-5 h-10 w-4/5 rounded-md bg-white/10 sm:h-12" />
            <div className="mx-auto mt-6 h-4 w-3/5 rounded bg-white/[0.07]" />
          </div>
        </Container>
      </div>

      <Container className="relative -mt-10 sm:-mt-12">
        <div className="aspect-[16/9] w-full rounded-2xl border border-night-700 bg-night-900" />
      </Container>

      <Container className="mt-12 sm:mt-14">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-4 w-full rounded bg-white/[0.07]" />
          <div className="h-4 w-full rounded bg-white/[0.07]" />
          <div className="h-4 w-4/5 rounded bg-white/[0.07]" />
        </div>
      </Container>
    </article>
  );
}
