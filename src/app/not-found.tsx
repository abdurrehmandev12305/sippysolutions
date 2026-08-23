import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site";

/** Shown for any route that doesn't exist. */
export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden bg-night-950 py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />

      <Container className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
          404 — Not found
        </p>

        <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          This page is on the roadmap
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-balance text-sm leading-relaxed text-night-300 sm:text-base">
          The page you're looking for isn't live yet. Head back home, or email us at{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-semibold text-brand-400 hover:underline"
          >
            {site.email}
          </a>{" "}
          and we'll help right away.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg">
            <ArrowLeft className="size-4" aria-hidden />
            Back to Home
          </ButtonLink>
          <ButtonLink href="/about" variant="outline" size="lg">
            About Us
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
