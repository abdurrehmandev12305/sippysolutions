import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { readPostBySlug } from "@/lib/news";
import { site } from "@/lib/site";

/**
 * Same backstop as the `/news` grid: the News Manager revalidates this exact
 * path on every write, so this only bounds how long a change made outside
 * the dashboard can stay invisible.
 */
export const revalidate = 30;

/** Deterministic across server and client: fixed locale, no relative phrasing. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await readPostBySlug(slug);

  if (!post) return { title: "News" };

  return {
    title: post.title,
    description: post.excerpt || `${post.title} — ${site.name} news.`,
    alternates: { canonical: `/news/${post.slug}` },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await readPostBySlug(slug);

  if (!post) notFound();

  // Plain text, no markdown — paragraphs are just blank-line separated.
  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="bg-night-950 pb-20 sm:pb-24">
      <div className="relative isolate overflow-hidden border-b border-night-800 bg-night-950 py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-[-8rem] -z-10 size-[28rem] rounded-full bg-brand-600/15 blur-[120px]"
        />

        <Container className="relative">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-medium text-night-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to News
          </Link>

          <div className="mx-auto mt-8 max-w-3xl text-center">
            <time
              dateTime={post.publishedAt}
              className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-400 sm:text-sm"
            >
              {formatDate(post.publishedAt)}
            </time>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="mx-auto mt-6 max-w-2xl text-balance text-sm leading-relaxed text-night-300 sm:text-base">
                {post.excerpt}
              </p>
            ) : null}
          </div>
        </Container>
      </div>

      {post.coverImageUrl ? (
        <Container className="relative -mt-10 sm:-mt-12">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-night-700 shadow-card">
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              preload
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </Container>
      ) : null}

      <Container className="mt-12 sm:mt-14">
        <div className="mx-auto max-w-3xl space-y-6">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-white sm:text-[0.95rem]"
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-night-400">
              This post has no content yet.
            </p>
          )}
        </div>
      </Container>
    </article>
  );
}
