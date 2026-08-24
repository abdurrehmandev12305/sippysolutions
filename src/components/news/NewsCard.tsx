import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import type { Post } from "@/lib/news";

/** Deterministic across server and client: fixed locale, no relative phrasing. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function NewsCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex flex-row overflow-hidden rounded-xl border border-night-700 bg-night-900 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-glow"
    >
      <span className="relative block aspect-[16/10] w-32 shrink-0 overflow-hidden bg-night-800 sm:w-40 lg:w-48">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt=""
            fill
            sizes="192px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          <span className="grid h-full place-items-center text-night-600">
            <Newspaper className="size-5" aria-hidden />
          </span>
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-3 sm:p-4">
        <h3 className="truncate text-lg font-bold leading-snug text-white sm:text-xl">
          {post.title}
        </h3>

        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand-400 sm:text-base">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span className="text-night-600" aria-hidden>
            ·
          </span>
          <span>{post.slug}</span>
        </p>

        {post.excerpt ? (
          <p className="line-clamp-2 text-base leading-snug text-night-300 sm:text-lg">
            {post.excerpt}
          </p>
        ) : null}

        <span className="inline-flex w-fit items-center gap-1.5 text-base font-semibold text-brand-400 transition-colors group-hover:text-brand-300">
          Read more
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
