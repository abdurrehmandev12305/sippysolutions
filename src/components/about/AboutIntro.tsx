import { ArrowRight, Cpu, Gauge, Network, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { aboutIntro } from "@/content/about";

const highlights = [
  { label: "Session Border Controller", icon: Network },
  { label: "Whitelabel Billing", icon: Gauge },
  { label: "Modular & Scalable", icon: Cpu },
  { label: "Secure by Design", icon: ShieldCheck },
];

export function AboutIntro() {
  return (
    <section className="relative isolate overflow-hidden bg-night-950 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-25 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-[-8rem] -z-10 size-[28rem] rounded-full bg-brand-600/15 blur-[120px]"
      />

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">
              {aboutIntro.label}
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {aboutIntro.heading}
            </h1>

            <span
              aria-hidden
              className="mt-5 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
            />

            <p className="mt-7 max-w-2xl text-sm leading-relaxed text-night-300 sm:text-base">
              {aboutIntro.body}
            </p>

            <div className="mt-9">
              <ButtonLink href="/contact" size="lg">
                Contact Us
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
          </div>

          {/* Decorative capability panel */}
          <div className="relative">
            <div className="rounded-3xl border border-night-700 bg-night-900/70 p-7 shadow-card backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-night-400">
                Platform at a glance
              </p>

              <ul className="mt-6 space-y-4">
                {highlights.map(({ label, icon: Icon }) => (
                  <li key={label} className="flex items-center gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-brand-500/25 bg-brand-500/10 text-brand-400">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-6 -left-6 -z-10 size-32 rounded-full bg-brand-500/20 blur-2xl"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
