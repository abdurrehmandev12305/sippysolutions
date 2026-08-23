"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Single collapsible row. Closed by default; the "+" glyph rotates 45° into a
 * "−" when open. Content is passed as children so it can stay server-rendered
 * (good for SEO on long policy text).
 *
 * If the page loads with `#<id>` in the URL — e.g. /about#privacy-policy — the
 * matching row opens itself and scrolls into view.
 */
export function AccordionRow({
  id,
  title,
  children,
  defaultOpen = false,
}: {
  id: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const panelId = `${uid}-panel`;
  const triggerId = `${uid}-trigger`;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const openFromHash = () => {
      if (window.location.hash !== `#${id}`) return;
      setOpen(true);
      // Wait for the expand transition so we scroll to the settled layout,
      // not to where the collapsed row used to be.
      timer = setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [id]);

  return (
    <div
      id={id}
      ref={rowRef}
      className={cn(
        "scroll-mt-28 overflow-hidden rounded-2xl border transition-colors duration-300",
        open
          ? "border-brand-500/50 bg-night-800/80"
          : "border-night-700 bg-night-800/40 hover:border-night-600",
      )}
    >
      <h3>
        <button
          id={triggerId}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7 sm:py-6"
        >
          <span
            className={cn(
              "text-base font-bold transition-colors sm:text-lg",
              open ? "text-brand-400" : "text-white",
            )}
          >
            {title}
          </span>

          <span
            aria-hidden
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-300",
              open
                ? "rotate-45 border-brand-500 bg-brand-500 text-white"
                : "border-night-600 text-brand-400",
            )}
          >
            <Plus className="size-4" />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className={cn("overflow-hidden", !open && "invisible")}>
          <div className="border-t border-night-700/70 px-5 py-6 sm:px-7 sm:py-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
