"use client";

import dynamic from "next/dynamic";

/**
 * Lazy client-only wrapper so three.js is code-split out of the initial
 * page bundle and never runs during SSR.
 */
const NetworkBackground = dynamic(
  () => import("./NetworkBackground").then((mod) => mod.NetworkBackground),
  { ssr: false },
);

export function HeroBackground({ className }: { className?: string }) {
  return <NetworkBackground className={className} />;
}
