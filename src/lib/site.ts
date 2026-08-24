/**
 * Single source of truth for site-wide config: navigation, contact details,
 * and metadata. Add a page? Add it to `navLinks` and it appears in the
 * Navbar + Footer automatically.
 */

export type NavLink = {
  label: string;
  href: string;
  /** Set false while a page is still a stub, to avoid dead links in prod. */
  ready?: boolean;
};

export const site = {
  name: "Sippy Solution",
  wordmark: "SIPPY SOLUTION",
  tagline: "Secure, scalable VoIP softswitch & class 4/5 solutions",
  description:
    "Sippy Solution delivers secure, scalable and affordable VoIP softswitch, class 4/5 switching, SBC, billing and dedicated server solutions to international mobile, MVNO and fixed line operators, wholesalers, call centres and enterprise SIP providers.",
  url: "https://www.sippysolution.com",
  email: "support@sippysolution.com",
  skype: "support@sippysolution.com",
  locations: "Germany · USA · and many more",
} as const;

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", ready: true },
  { label: "About", href: "/about", ready: true },
  { label: "Services", href: "/services", ready: true },
  { label: "Interface", href: "/user-interface", ready: true },
  { label: "Pricing", href: "/pricing", ready: true },
  { label: "News", href: "/news", ready: true },
  { label: "Contact", href: "/contact" },
];
