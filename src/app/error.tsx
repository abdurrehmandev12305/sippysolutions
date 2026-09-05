"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Button, ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site";

/**
 * Fallback for an unexpected runtime error anywhere under the root layout.
 * Deliberately styled like `not-found.tsx` — same night-950 section, same grid
 * wash, same heading rhythm — so a failure still looks like the site.
 *
 * `retry()` re-fetches and re-renders the segment (the Next 16 successor to
 * `reset()`, which only cleared the boundary without re-fetching). That is the
 * useful action here: the errors this page can realistically see are transient
 * ones, so trying again is usually enough.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // The message itself stays out of the visitor's face; this is what makes it
    // recoverable in the server log or an error reporter.
    console.error(error);
  }, [error]);

  return (
    <section className="relative isolate overflow-hidden bg-night-950 py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />

      <Container className="text-center">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
          <TriangleAlert className="size-4" aria-hidden />
          Something went wrong
        </p>

        <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          This page didn&rsquo;t load
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-balance text-sm leading-relaxed text-night-300 sm:text-base">
          Something on our end broke while putting this page together. Try again
          &mdash; and if it keeps happening, email us at{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-semibold text-brand-400 hover:underline"
          >
            {site.email}
          </a>{" "}
          and we&rsquo;ll look into it.
        </p>

        {/* The digest is the only handle support has to find this exact failure
            in the logs, so it is shown when React provides one. */}
        {error.digest ? (
          <p className="mt-6 text-xs tracking-widest text-night-400">
            Reference: <span className="tabular-nums">{error.digest}</span>
          </p>
        ) : null}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => retry()}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            Back to Home
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
