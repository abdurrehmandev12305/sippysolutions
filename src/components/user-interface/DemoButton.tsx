"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, KeyRound, X } from "lucide-react";

import type { DemoAccess } from "@/lib/demo-access";

type Field = "url" | "username" | "password";

/**
 * "Demo" button + popover for `/user-interface`, showing the shared demo
 * console's URL/username/password in plain text with a Copy button each.
 *
 * Hand-rolled dialog (focus trap, Escape, scroll lock, backdrop click),
 * same pattern as `ScreenshotLightbox` on this same page — no new
 * dependency, and it keeps the brand hover treatment and dark palette
 * consistent with the rest of the site.
 */
export function DemoButton({ access }: { access: DemoAccess }) {
  const uid = useId();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<Field | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Distinguishes "closed because it was just dismissed" from "closed because
  // the page only just rendered" — the focus effect below must act on the
  // first but never on the second.
  const hasOpened = useRef(false);

  // Keyboard control + scroll lock, live only while the popover is open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "Tab") {
        trapTab(event, dialogRef.current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Move focus into the dialog on open, and back to the trigger on close.
  //
  // This also runs on mount, where `open` is already false. Returning focus
  // there would pull it — and the scroll position — onto the trigger the
  // moment the page loads, so the close branch is gated on the dialog having
  // actually been open at some point.
  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      closeRef.current?.focus();
    } else if (hasOpened.current) {
      triggerRef.current?.focus();
    }
  }, [open]);

  // Reverts the per-field "copied" check mark after a beat.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy(field: Field, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
    } catch {
      // Clipboard API can be unavailable (insecure context, denied
      // permission) — a silent no-op is better than throwing in the
      // visitor's face over a convenience feature.
    }
  }

  const closeOnBackdrop = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) setOpen(false);
  };

  const rows: { key: Field; label: string; value: string }[] = [
    { key: "url", label: "URL", value: access.url },
    { key: "username", label: "Username", value: access.username },
    { key: "password", label: "Password", value: access.password },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-500/40 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-night-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500/10 hover:text-white active:translate-y-0"
      >
        <KeyRound className="size-4" aria-hidden />
        View Demo
      </button>

      {open
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${uid}-title`}
              onClick={closeOnBackdrop}
              // Portaled to <body> below, so this z-index sits in the root
              // stacking context: the `isolate` wrapper this button renders
              // inside would otherwise trap it, letting the sticky navbar (z-50)
              // paint over the dialog and swallow clicks meant for it.
              className="fixed inset-0 z-[9999] grid place-items-center bg-night-950/80 p-4 backdrop-blur-sm"
            >
              <div className="max-h-[85dvh] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-brand-500/30 bg-[#0a0a0f] p-6 shadow-card sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 id={`${uid}-title`} className="text-base font-bold text-white">
                    Demo Access
                  </h2>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="grid size-9 place-items-center rounded-lg border border-night-700 text-night-300 transition-colors hover:border-night-500 hover:text-white"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>

                <div className="space-y-3">
                  {rows.map((row) => (
                    <div key={row.key}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-night-300">
                        {row.label}
                      </p>
                      <div className="flex items-center gap-2 rounded-xl border border-night-700 bg-night-900/70 px-3 py-2.5">
                        <span className="flex-1 truncate text-sm text-white">
                          {row.value || "Not set yet"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copy(row.key, row.value)}
                          disabled={!row.value}
                          aria-label={`Copy ${row.label}`}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-night-300 transition-colors hover:bg-brand-500/10 hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {copied === row.key ? (
                            <Check className="size-4 text-emerald-400" aria-hidden />
                          ) : (
                            <Copy className="size-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
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
