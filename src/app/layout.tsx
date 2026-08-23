import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { TawkChat } from "@/components/layout/TawkChat";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — VoIP Softswitch, Class 4/5 & Dedicated Servers`,
    // Every new page only needs `title: "Services"` and gets the suffix free.
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "VoIP softswitch",
    "VOS3000",
    "class 4 switch",
    "class 5 switch",
    "session border controller",
    "VoIP billing",
    "dedicated server",
    "MVNO",
    "wholesale VoIP",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — VoIP Softswitch & Dedicated Server Solutions`,
    description: site.description,
    url: site.url,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#070a13",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* `Reveal` ships its children at `opacity-0` and clears that from an
            effect, so with scripts blocked every revealed section would stay
            invisible despite being in the HTML. Declared once here rather than
            per instance; inert whenever JavaScript runs. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col bg-night-950 text-night-100">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <Navbar />

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer />

        <TawkChat />
      </body>
    </html>
  );
}
