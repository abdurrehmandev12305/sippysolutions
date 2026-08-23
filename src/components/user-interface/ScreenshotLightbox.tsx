"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/cn";
import type { MediaItem } from "@/lib/media";

/**
 * The full-screen viewer for `/user-interface`, split out of
 * `ScreenshotGallery` so its dialog, focus trap, keyboard handling and
 * resize-fitting code are a separate chunk that only downloads when a visitor
 * actually opens a screenshot. The grid itself no longer carries any of it.
 *
 * This component is mounted only while the viewer is open, which is what drives
 * the fade-in and the per-item load reset below — both used to be keyed off an
 * `isOpen` flag inside the gallery.
 *
 * Returning focus to the thumbnail stays with the gallery: it owns the trigger
 * refs, and by the time focus has to go back this component is gone.
 */
export function ScreenshotLightbox({
  media,
  openIndex,
  onClose,
  onStep,
}: {
  media: MediaItem[];
  openIndex: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const count = media.length;
  const current = media[openIndex];

  const [shown, setShown] = useState(false);
  const [loaded, setLoaded] = useState(false);
  /** The current item's real pixel dimensions, learned from `onLoad`. */
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  /** The `object-fit: contain` box those dimensions resolve to inside the stage. */
  const [boxSize, setBoxSize] = useState<{ width: number; height: number } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /** Closes only when the click landed on the backdrop itself, not on a child. */
  const closeOnBackdrop = (event: React.MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  // Keyboard control + scroll lock, live for as long as this is mounted.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;
        case "ArrowRight":
        case "ArrowLeft":
          event.preventDefault();
          onStep(event.key === "ArrowRight" ? 1 : -1);
          break;
        case "Tab":
          trapTab(event, dialogRef.current);
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, onStep]);

  // Fade the overlay in on the frame after it mounts.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Move focus into the dialog on open.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Each item gets its own load, so the placeholder returns on every move.
  useEffect(() => {
    setLoaded(false);
    setNatural(null);
    setBoxSize(null);
  }, [openIndex]);

  /**
   * Sizes the media wrapper to exactly the box `object-fit: contain` would
   * occupy — never larger than the image's own pixels, so there is no
   * invisible margin around the picture for a click to land on, matching
   * how a plain `<img>` with only `max-height`/`max-width` used to shrink-wrap
   * itself. Recomputed on resize, same as that CSS did for free. Also gates
   * `loaded`, so the fade-in only ever happens once the box is sized.
   */
  useEffect(() => {
    if (!natural) return;
    const stage = stageRef.current;
    if (!stage) return;

    const fit = () => {
      const scale = Math.min(
        stage.clientWidth / natural.width,
        stage.clientHeight / natural.height,
        1, // Never upscale past the image's real size — same as before.
      );
      setBoxSize({
        width: Math.round(natural.width * scale),
        height: Math.round(natural.height * scale),
      });
      setLoaded(true);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [natural]);

  if (!current) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot ${openIndex + 1} of ${count}`}
      onClick={closeOnBackdrop}
      className={cn(
        // Above the sticky navbar (z-50) and the floating chat launcher.
        "fixed inset-0 z-[9999] flex flex-col gap-3 bg-night-950/95 p-4 backdrop-blur-sm transition-opacity duration-200 sm:p-6",
        shown ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-4">
        <p
          aria-live="polite"
          className="rounded-full border border-night-700 bg-night-900/80 px-3.5 py-1.5 text-xs font-semibold tabular-nums tracking-widest text-night-200"
        >
          {openIndex + 1} / {count}
        </p>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="grid size-10 place-items-center rounded-full border border-night-700 bg-night-900/80 text-night-200 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {/* Stage — clicking the space around the media closes the viewer. */}
      <div
        ref={stageRef}
        onClick={closeOnBackdrop}
        className="relative flex min-h-0 flex-1 items-center justify-center"
      >
        {count > 1 ? (
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="Previous item"
            className="absolute left-0 z-10 grid size-11 place-items-center rounded-full border border-night-700 bg-night-900/80 text-night-200 backdrop-blur-sm transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white sm:size-12"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
        ) : null}

        {/* Sized in JS to the exact `object-fit: contain` box (see the
            effect above) rather than left to intrinsic CSS sizing, which
            is what `fill` mode requires. That box has no letterboxing by
            construction, so it's still true that clicking the space
            around the picture — not the picture itself — lands on the
            backdrop and closes the viewer. */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-night-700 shadow-2xl transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
          style={{ width: boxSize?.width ?? 0, height: boxSize?.height ?? 0 }}
        >
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="90vw"
            draggable={false}
            onLoad={(event) => {
              const img = event.currentTarget;
              setNatural({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            className="object-contain"
          />
        </div>

        {!loaded ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-night-700 border-t-brand-400"
          />
        ) : null}

        {count > 1 ? (
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="Next item"
            className="absolute right-0 z-10 grid size-11 place-items-center rounded-full border border-night-700 bg-night-900/80 text-night-200 backdrop-blur-sm transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white sm:size-12"
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="shrink-0 text-center text-xs text-night-400">{current.alt}</p>
    </div>
  );
}

/** Keeps Tab inside the dialog, cycling through its buttons. */
function trapTab(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (!dialog) return;

  const focusable = dialog.querySelectorAll<HTMLElement>(
    "button:not([disabled])",
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
