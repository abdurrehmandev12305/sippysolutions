"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Zap } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { navLinks, site } from "@/lib/site";

function SoftswitchBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-200 backdrop-blur-sm">
      <Zap className="size-3.5 text-brand-400" aria-hidden />
      Global VoIP Infrastructure
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || open
          ? "border-night-800 bg-night-950/90 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link
            href="/"
            className="group flex items-center gap-2.5"
            aria-label={`${site.name} — home`}
          >
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-glow">
              S
            </span>
            <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-white sm:text-base">
              Sippy<span className="text-brand-500">Solution</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-brand-400"
                    : "text-night-300 hover:text-white",
                )}
              >
                {link.label}
                {isActive(link.href) ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-brand-500"
                  />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 lg:block">
            <SoftswitchBadge />
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-lg border border-night-700 text-night-200 transition-colors hover:border-brand-500 hover:text-white lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-night-800 bg-night-950/95 backdrop-blur-md lg:hidden"
      >
        <Container className="py-4">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-brand-500/10 text-brand-400"
                    : "text-night-200 hover:bg-white/5 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex justify-center">
            <SoftswitchBadge />
          </div>
        </Container>
      </div>
    </header>
  );
}
