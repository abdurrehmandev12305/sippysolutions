import type { Metadata } from "next";

import { ServicesHero } from "@/components/services/ServicesHero";
import { FeatureSections } from "@/components/services/FeatureSections";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description: `${site.name} features — dedicated servers, fully web-based access, SSL certificates, class 4/5 switching, real-time monitoring and XML-RPC API control.`,
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <FeatureSections />
    </>
  );
}
