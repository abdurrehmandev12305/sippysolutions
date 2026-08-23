import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceIllustration } from "@/components/services/ServiceIllustration";
import { serviceFeatures } from "@/content/serviceFeatures";
import { cn } from "@/lib/cn";

/**
 * Zigzag feature list: illustration left / copy right, then mirrored, and so on
 * down the page. Below `lg` everything stacks with the illustration on top.
 */
export function FeatureSections() {
  return (
    <>
      {serviceFeatures.map((feature, index) => {
        const mirrored = index % 2 === 1;

        return (
          <section
            key={feature.id}
            id={feature.id}
            className={cn(
              "relative isolate overflow-hidden scroll-mt-24 border-t border-night-800 py-16 sm:py-24",
              mirrored ? "bg-night-900" : "bg-night-950",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-1/2 -z-10 size-[26rem] -translate-y-1/2 rounded-full bg-brand-600/10 blur-[120px]",
                mirrored ? "-left-40" : "-right-40",
              )}
            />

            <Container className="relative">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Illustration */}
                <Reveal className={cn(mirrored && "lg:order-2")}>
                  <div className="relative overflow-hidden rounded-3xl border border-night-700 bg-night-900/70 p-6 shadow-card backdrop-blur-sm sm:p-10">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-grid opacity-20"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent"
                    />
                    <ServiceIllustration
                      name={feature.illustration}
                      className="relative"
                    />
                  </div>
                </Reveal>

                {/* Copy */}
                <Reveal
                  delay={90}
                  className={cn(mirrored && "lg:order-1")}
                >
                  <span className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-brand-400">
                    {`0${index + 1}`}
                    <span
                      aria-hidden
                      className="h-px w-8 bg-gradient-to-r from-brand-500 to-transparent"
                    />
                  </span>

                  <h2 className="mt-4 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
                    {feature.title}
                  </h2>

                  <span
                    aria-hidden
                    className="mt-5 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
                  />

                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-night-300 sm:text-base">
                    {feature.description}
                  </p>

                  <div className="mt-8">
                    <ButtonLink href="/contact" size="lg">
                      Schedule Now
                      <ArrowRight className="size-4" aria-hidden />
                    </ButtonLink>
                  </div>
                </Reveal>
              </div>
            </Container>
          </section>
        );
      })}
    </>
  );
}
