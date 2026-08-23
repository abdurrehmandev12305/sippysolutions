import type { Metadata } from "next";

import { AboutIntro } from "@/components/about/AboutIntro";
import { PolicyAccordions } from "@/components/about/PolicyAccordions";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Sippy Solution software is modular and easily scalable — a session border controller (SBC) plus a whitelabel billing platform for operators, wholesalers, call centres and enterprise SIP providers.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <AboutIntro />
      <PolicyAccordions />
    </>
  );
}
