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
      <section className="bg-night-950 py-20 sm:py-24">
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
    <section className="bg-night-950 pb-20 sm:pb-24">
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
                  className="group block w-full overflow-hidden rounded-2xl border border-night-700 bg-night-900 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-glow focus-visible:border-brand-500 motion-reduce:hover:translate-y-0"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden">
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
                      className="absolute left-3 top-3 rounded-full bg-night-950/70 px-2.5 py-1 text-[0.65rem] font-semibold tabular-nums tracking-widest text-night-200 backdrop-blur-sm"
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
