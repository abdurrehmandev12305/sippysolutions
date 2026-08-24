import { Activity, ArrowRight, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { HeroVideo } from "@/components/home/HeroVideo";

const featureTags = [
  { label: "Real-Time Monitoring", icon: Activity },
  { label: "SSL Certificate", icon: ShieldCheck },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-night-950">
      {/* 3D wireframe sphere loop */}
      <HeroVideo />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 bg-night-950/50"
      />

      {/* Depth + "cable run" atmospherics, all pure CSS */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-[-10rem] -z-10 size-[34rem] rounded-full bg-brand-600/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-[-14rem] -z-10 size-[30rem] rounded-full bg-brand-500/10 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-night-950/40 via-night-950/70 to-night-950"
      />

      {/* Fibre-cable strands */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 w-full opacity-50"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="cable" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff3b30" stopOpacity="0" />
            <stop offset="50%" stopColor="#ff3b30" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff3b30" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 160 C 320 60, 560 220, 1440 90"
          fill="none"
          stroke="url(#cable)"
          strokeWidth="1.5"
        />
        <path
          d="M0 200 C 380 110, 700 240, 1440 140"
          fill="none"
          stroke="url(#cable)"
          strokeWidth="1"
        />
        <path
          d="M0 120 C 420 200, 820 40, 1440 180"
          fill="none"
          stroke="url(#cable)"
          strokeWidth="0.75"
        />
      </svg>

      <Container className="relative py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.32em] text-brand-400 sm:text-sm [animation-delay:1.5s]">
            VoIP Softswitch &amp; Class 4/5 Solutions
          </p>

          <h1 className="mt-6 animate-fade-up text-4xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl [animation-delay:1.65s]">
            <span className="bg-gradient-to-r from-brand-300 via-brand-500 to-brand-400 bg-clip-text text-transparent">
              Sippy
            </span>{" "}
            Solution
          </h1>

          <p className="mx-auto mt-7 max-w-3xl animate-fade-up text-balance text-sm leading-relaxed text-night-300 sm:text-base lg:text-lg [animation-delay:1.8s]">
            Delivered to international Mobile, MVNO, and Fixed Line Operators;
            Wholesalers, Call Centers, and Retail/Enterprise SIP solution providers are
            the most secure, scalable, flexible, and affordable speech technology
            solutions.
          </p>

          <ul className="mt-9 flex animate-fade-up flex-wrap items-center justify-center gap-3 [animation-delay:1.95s]">
            {featureTags.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-200 backdrop-blur-sm sm:text-xs"
              >
                <Icon className="size-3.5 text-brand-400" aria-hidden />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-11 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:2.1s] sm:flex-row">
            <ButtonLink href="#services" size="lg">
              Explore Services
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/about" variant="outline" size="lg">
              About Sippy Solution
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
