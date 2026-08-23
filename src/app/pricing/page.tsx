import type { Metadata } from "next";
import { Suspense } from "react";

import { PricingHero } from "@/components/pricing/PricingHero";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingGridSkeleton } from "@/components/pricing/PricingCardSkeleton";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { readPlans } from "@/lib/pricing";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${site.name} softswitch pricing — concurrent call plans on dedicated Xeon servers in Germany, from €80 per month.`,
  alternates: { canonical: "/pricing" },
};

/**
 * Plans are cached and re-read from Supabase at most twice a minute, so a
 * visitor is served HTML that already has the grid in it rather than waiting
 * on a query.
 *
 * This is a backstop, not the main path: the Pricing Manager calls
 * `revalidatePath("/pricing")` on every successful write, so an admin edit is
 * live on the next visit rather than on the next tick of this timer. The 30
 * seconds only bounds how long a change made *outside* the dashboard — a hand
 * edit in the Supabase table editor — can stay invisible.
 */
export const revalidate = 30;

/**
 * The only part of the page that waits on Supabase. Keeping the `await` down
 * here — rather than at the top of `PricingPage` — is what lets the hero, the
 * headings and the custom-quote panel reach the browser in the first chunk,
 * with the grid streaming into its skeleton when the query answers.
 */
async function PricingGrid() {
  const plans = await readPlans();

  if (plans.length === 0) {
    return (
      <p className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] px-6 py-10 text-center text-sm text-night-300">
        Our plans are being updated. Please{" "}
        <a
          href={`mailto:${site.email}`}
          className="font-semibold text-brand-400 hover:text-brand-300"
        >
          get in touch
        </a>{" "}
        for a current quote.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan, index) => (
        <Reveal key={plan.id} delay={(index % 3) * 90} className="h-full">
          <PricingCard plan={plan} />
        </Reveal>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <PricingHero />

      <section className="bg-night-900 py-16 sm:py-20">
        <Container>
          <Suspense fallback={<PricingGridSkeleton />}>
            <PricingGrid />
          </Suspense>

          <div className="mt-14 rounded-2xl border border-white/10 bg-[#0a0a0f] px-6 py-10 text-center sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Need more capacity, or a different region?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-sm leading-relaxed text-night-300 sm:text-base">
              Higher concurrent-call tiers, custom hardware and servers outside
              Germany are all available. Tell us your traffic profile and we&rsquo;ll
              size it for you.
            </p>
            <ButtonLink href="/contact" size="lg" className="mt-7">
              Request a custom quote
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
