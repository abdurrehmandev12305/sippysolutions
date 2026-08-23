import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AccordionRow } from "@/components/ui/Accordion";
import { RichText } from "@/components/ui/RichText";
import { PaymentMethods } from "@/components/about/PaymentMethods";
import { aboutAccordions } from "@/content/about";

export function PolicyAccordions() {
  return (
    <section className="bg-night-900 py-20 sm:py-28">
      <Container>
        <SectionHeading
          label="Good to know"
          title="Policies & Terms"
          description="Our privacy policy, server rental terms and accepted payment methods — expand any section to read the details."
        />

        <div className="mx-auto mt-12 max-w-4xl space-y-4">
          {aboutAccordions.map((item) => (
            <AccordionRow key={item.id} id={item.id} title={item.title}>
              <RichText blocks={item.blocks} />
              {item.showPaymentMethods ? <PaymentMethods /> : null}
            </AccordionRow>
          ))}
        </div>
      </Container>
    </section>
  );
}
