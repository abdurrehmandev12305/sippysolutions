import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { services } from "@/content/services";

export function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 bg-[#050508] py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <Container className="relative">
        <SectionHeading
          label="What We Offer"
          title="Services"
          description="Everything a VoIP carrier needs to launch, bill and monitor traffic — on infrastructure you fully control."
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon;

            return (
              <Reveal key={service.title} delay={index * 70}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-zinc-800/80 bg-black p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50">
                  {/* Hover wash */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.09] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <div className="relative">
                    <Icon className="size-8 text-white" aria-hidden />

                    <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-white">
                      {service.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                      {service.description}
                    </p>
                  </div>

                  <span
                    aria-hidden
                    className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-500 group-hover:w-full"
                  />
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
