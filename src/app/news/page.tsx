import type { Metadata } from "next";
import { Suspense } from "react";

import { NewsHero } from "@/components/news/NewsHero";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsGridSkeleton } from "@/components/news/NewsCardSkeleton";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { readPosts } from "@/lib/news";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "News",
  description: `Announcements and updates from ${site.name}.`,
  alternates: { canonical: "/news" },
};

/**
 * Posts are cached and re-read from Supabase at most twice a minute, so a
 * visitor is served HTML that already has the grid in it rather than waiting
 * on a query.
 *
 * This is a backstop, not the main path: the News Manager calls
 * `revalidatePath("/news")` on every successful write, so an admin edit is
 * live on the next visit rather than on the next tick of this timer.
 */
export const revalidate = 30;

/**
 * The only part of the page that waits on Supabase. Keeping the `await` down
 * here — rather than at the top of `NewsPage` — is what lets the hero reach
 * the browser in the first chunk, with the grid streaming into its skeleton
 * when the query answers.
 */
async function NewsGrid() {
  const posts = await readPosts();

  if (posts.length === 0) {
    return (
      <p className="mx-auto max-w-md rounded-2xl border border-white/10 bg-night-950 px-6 py-10 text-center text-sm text-night-300">
        Nothing&apos;s been published yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 sm:gap-3">
      {posts.map((post, index) => (
        <li key={post.id}>
          <Reveal delay={(index % 3) * 90}>
            <NewsCard post={post} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export default function NewsPage() {
  return (
    <>
      <NewsHero />

      <section className="bg-night-950 pb-20 sm:pb-24">
        <Container>
          <Suspense fallback={<NewsGridSkeleton />}>
            <NewsGrid />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
