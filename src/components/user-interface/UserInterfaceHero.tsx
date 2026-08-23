import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";

/**
 * "USER INTERFACE" banner at the top of `/user-interface`. Same dark treatment
 * as the Services, About and Contact heroes: night-950 base, faint grid,
 * brand glow.
 *
 * `hint` is the one clause that depends on whether the gallery has anything in
 * it. It arrives as a slot rather than as a `count` number so this component
 * stays free of the Supabase read — the page works that out once and passes
 * down the resulting string (or `null`).
 */
export function UserInterfaceHero({ hint }: { hint?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-night-950 py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-[-8rem] -z-10 size-[28rem] rounded-full bg-brand-600/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-[-10rem] -z-10 size-[24rem] rounded-full bg-brand-500/10 blur-[120px]"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-400 sm:text-sm">
            See It In Action
          </p>

          <h1 className="mt-5 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
            User Interface
          </h1>

          <span
            aria-hidden
            className="mx-auto mt-6 block h-1 w-20 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
          />

          <p className="mx-auto mt-7 max-w-2xl text-balance text-sm leading-relaxed text-night-300 sm:text-base">
            A look inside the switch: billing, routing, CDR reporting and
            real-time monitoring, all from one fully web-based console.
            {hint}
          </p>
        </div>
      </Container>
    </section>
  );
}
