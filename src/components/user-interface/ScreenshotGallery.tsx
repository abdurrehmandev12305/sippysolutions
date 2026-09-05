"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, ImageOff } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { MediaItem } from "@/lib/media";

/**
 * Thumbnail grid for `/user-interface`.
 *
 * The viewer is a separate chunk, pulled in only once a visitor opens a
 * screenshot: its dialog, focus trap, keyboard handling and resize-fitting
 * code are dead weight for everyone who just scrolls the grid. `ssr: false`
 * because it can never render on the server — nothing is open on first paint.
 *
 * It is hand-rolled rather than pulled from a package: the site already builds
 * its own overlays with Tailwind transitions (see `Accordion`, `Reveal`), it
 * needs no dependency, and it keeps the brand hover treatment and the dark
 * palette under our control.
 */
const ScreenshotLightbox = dynamic(
  () => import("./ScreenshotLightbox").then((mod) => mod.ScreenshotLightbox),
  { ssr: false },
);

export function ScreenshotGallery({ media }: { media: MediaItem[] }) {
  const count = media.length;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  /** Which thumbnail opened the lightbox, so focus can go back to it. */
  const openedFrom = useRef<number | null>(null);

  const open = (index: number) => {
    openedFrom.current = index;
    setOpenIndex(index);
  };

  const close = useCallback(() => setOpenIndex(null), []);

  /** Wraps around at both ends, so navigation never dead-ends. */
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((index) =>
        index === null ? index : (index + delta + count) % count,
      ),
    [count],
  );

  // Send focus back to the thumbnail once the viewer has closed.
  useEffect(() => {
    if (openIndex !== null) return;

    if (openedFrom.current !== null) {
      triggers.current[openedFrom.current]?.focus();
      openedFrom.current = null;
    }
  }, [openIndex]);

  if (count === 0) {
    return (
      <section className="relative isolate border-t border-white/[0.05] bg-night-900/25 py-20 sm:py-24">
        {/* Eases the tint out of the hero above, so the band reads as a
            separate surface without a hard seam across the page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-night-950 to-transparent"
        />

        <Container>
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-night-700 bg-night-900/40 px-6 py-14 text-center">
            <ImageOff className="mx-auto size-8 text-night-500" aria-hidden />
            <p className="mt-4 text-sm text-night-300">
              Nothing published yet. Screenshots added in the
              dashboard&apos;s User Interface Manager appear here.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative isolate border-t border-white/[0.05] bg-night-900/25 pt-14 pb-20 sm:pt-16 sm:pb-24">
      {/* Eases the tint out of the hero above, so the band reads as a
          separate surface without a hard seam across the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-night-950 to-transparent"
      />

      {/* Monitor texture — a faint grid with scan lines over it. Both are
          masked back to flat navy at the band's edges so the texture never
          collides with the hero fade above or the footer rule below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.35] [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-scanlines [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
      />

      <Container>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item, index) => (
            <li key={item.file}>
              <Reveal delay={Math.min(index, 7) * 60}>
                <button
                  ref={(node) => {
                    triggers.current[index] = node;
                  }}
                  type="button"
                  onClick={() => open(index)}
                  aria-label={`View ${item.alt} — ${index + 1} of ${count}`}
                  aria-haspopup="dialog"
                  className="group block w-full rounded-2xl border border-brand-500/30 bg-[#0d0f1a] p-1.5 shadow-screenshot transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-screenshot-glow focus-visible:border-brand-500 focus-visible:shadow-screenshot-glow motion-reduce:hover:translate-y-0"
                >
                  {/* Header strip — the same accent that underlines the
                      active nav item, tying the card to the site palette. */}
                  <span
                    aria-hidden
                    className="block h-[3px] w-full rounded-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600 opacity-70 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                  />

                  <span className="relative mt-1.5 block aspect-[16/10] overflow-hidden rounded-xl">
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      // Above-the-fold only: index 0-3 is the first row at the
                      // widest (xl:grid-cols-4) breakpoint, so it's the only
                      // slice of the grid that's ever on screen without
                      // scrolling, on any viewport.
                      preload={index < 4}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
                    />

                    {/* Resting tint. The screenshots are light-background
                        UI, so a wash of night over them settles the tile into
                        the page while leaving every label legible. It stays
                        put under the hover scrim below, which is what darkens
                        the tile for the eye button. */}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-night-950/20"
                    />

                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-xl ring-1 ring-inset ring-brand-400/20 shadow-[inset_0_14px_20px_-14px_rgb(7_10_19/0.95),inset_0_-14px_20px_-14px_rgb(7_10_19/0.95)] transition-colors duration-300 group-hover:ring-brand-400/50 group-focus-visible:ring-brand-400/50"
                    />

                    <span
                      aria-hidden
                      className="absolute inset-0 bg-night-950/65 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    />

                    <span
                      aria-hidden
                      className="absolute inset-0 grid place-items-center"
                    >
                      <span className="grid size-11 translate-y-2 place-items-center rounded-full bg-brand-500 text-white opacity-0 shadow-glow transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                        <Eye className="size-5" />
                      </span>
                    </span>

                    <span
                      aria-hidden
                      className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-brand-500 text-[0.7rem] font-bold tabular-nums text-white ring-2 ring-inset ring-white/20 shadow-[0_4px_14px_-2px_rgb(255_59_48/0.75)]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                </button>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>

      {openIndex !== null ? (
        <ScreenshotLightbox
          media={media}
          openIndex={openIndex}
          onClose={close}
          onStep={step}
        />
      ) : null}
    </section>
  );
}
