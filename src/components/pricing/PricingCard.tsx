import Link from "next/link";
import { PhoneCall } from "lucide-react";

import type { Plan } from "@/lib/pricing";

/**
 * One plan on `/pricing`: name, spec table, server location, and a solid blue
 * price button that drops the visitor into the contact form.
 */
export function PricingCard({ plan }: { plan: Plan }) {
  // Location is rendered as the closing spec row so it lines up with the rest
  // of the table, but it stays a first-class field on the plan.
  const rows = [
    ...plan.specs,
    {
      label: "Location",
      value: plan.flag ? `${plan.location} ${plan.flag}` : plan.location,
    },
  ];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/60 hover:shadow-glow">
      <header className="border-b border-white/10 px-6 py-6 text-center">
        <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          {plan.name}
        </h3>
      </header>

      <dl className="flex-1 divide-y divide-white/[0.06] px-6 py-2">
        {rows.map((spec) => (
          <div
            key={spec.label}
            className="flex items-baseline justify-between gap-4 py-3.5 text-sm"
          >
            <dt className="shrink-0 font-medium text-white/55">{spec.label}</dt>
            <dd className="text-right font-semibold text-white">{spec.value}</dd>
          </div>
        ))}
      </dl>

      <div className="p-6 pt-4">
        <Link
          href="/contact"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 sm:text-base"
          aria-label={`Enquire about ${plan.name} — ${plan.currency}${plan.price} ${plan.period}`}
        >
          <PhoneCall className="size-4 shrink-0" aria-hidden />
          <span>
            {plan.currency}
            {plan.price}
          </span>
          <span className="font-semibold text-white/80">{plan.period}</span>
        </Link>
      </div>
    </article>
  );
}
