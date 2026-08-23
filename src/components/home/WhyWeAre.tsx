import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { advantages } from "@/content/services";

/**
 * "Why We Are?" — four circular icon badges. Titles/descriptions are
 * placeholders (see `advantages` in src/content/services.ts) until the final
 * copy is supplied.
 */
export function WhyWeAre() {
  return (
    <section id="why-us" className="scroll-mt-24 bg-night-950 py-20 sm:py-28">
      <Container>
        <SectionHeading label="Our Strengths" title="Why We Are?" />

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((item, index) => {
            const Icon = item.icon;

            return (
              <Reveal key={item.title} delay={index * 80}>
                <div className="group flex flex-col items-center text-center">
                  <span className="relative grid size-28 place-items-center rounded-full border border-night-700 bg-night-900 transition-colors duration-300 group-hover:border-brand-500">
                    {/* Rotating dashed accent ring */}
                    <span
                      aria-hidden
                      className="absolute inset-[-6px] rounded-full border border-dashed border-brand-500/30 transition-transform duration-700 group-hover:rotate-90"
                    />
                    <Icon
                      className="size-10 text-brand-500 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden
                    />
                  </span>

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-night-400">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
