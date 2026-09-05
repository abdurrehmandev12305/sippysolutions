import Link from "next/link";
import { Mail, MapPin, MessageSquare } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { navLinks, site } from "@/lib/site";
import { services } from "@/content/services";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-night-800 bg-night-950">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white">
                S
              </span>
              <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">
                Sippy<span className="text-brand-500">Solution</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-night-400">
              {site.tagline} for carriers, wholesalers, call centres and
              enterprise SIP providers worldwide.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
              Company
            </h2>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-night-400 transition-colors hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
              Services
            </h2>
            <ul className="mt-4 space-y-2.5">
              {services.map((service) => (
                <li key={service.title} className="text-sm text-night-400">
                  {service.title}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
              Get in touch
            </h2>
            <ul className="mt-4 space-y-3.5 text-sm">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-start gap-2.5 text-night-400 transition-colors hover:text-brand-400"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                  <span className="break-all">{site.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={site.teamsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-night-400 transition-colors hover:text-brand-400"
                >
                  <MessageSquare
                    className="mt-0.5 size-4 shrink-0 text-brand-500"
                    aria-hidden
                  />
                  <span className="break-all">Chat on Teams</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-night-400">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                <span>{site.locations}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-night-800 pt-6 text-xs text-night-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>
            <Link
              href="/about#privacy-policy"
              className="transition-colors hover:text-brand-400"
            >
              Privacy Policy
            </Link>
            <span className="mx-2 text-night-700">·</span>
            <Link
              href="/about#payment-method"
              className="transition-colors hover:text-brand-400"
            >
              Payment Methods
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
