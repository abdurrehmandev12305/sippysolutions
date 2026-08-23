import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Tell ${site.name} which service you need — dedicated servers, class 4/5 switching, SSL, real-time monitoring or XML-RPC API control — and our team will get back to you.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
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
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-start text-left">
            <span className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-400">
              Contact
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Get in touch
            </h1>

            <span
              aria-hidden
              className="mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
            />

            <p className="mt-5 text-balance text-base leading-relaxed text-night-300">
              Tell us which service you&rsquo;re interested in and a little about
              your setup — we&rsquo;ll come back to you with next steps.
            </p>
          </div>

          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
