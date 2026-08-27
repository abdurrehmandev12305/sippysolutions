"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";

import { cn } from "@/lib/cn";
import type { DemoAccess } from "@/lib/demo-access";

const ENDPOINT = "/api/admin/demo-access";

const field =
  "w-full rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-night-400 transition-colors hover:border-night-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60";

const label =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-night-300";

type Notice = { kind: "success" | "error"; text: string } | null;

/**
 * The one-row counterpart to `PricingManager`/`MediaManager`/`NewsManager`:
 * no list, no create/delete — just the single `demo_access` row shown as a
 * form with a Save button. Backs the "Demo" popover on `/user-interface`.
 */
export function DemoAccessManager({
  initialAccess,
}: {
  initialAccess: DemoAccess;
}) {
  const router = useRouter();
  const uid = useId();

  const [draft, setDraft] = useState<DemoAccess>(initialAccess);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const result: { ok?: boolean; access?: DemoAccess; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.access) {
        setNotice({
          kind: "error",
          text: result.errors?.join(" ") ?? "Couldn't save demo access. Please try again.",
        });
        return;
      }

      setDraft(result.access);
      setNotice({ kind: "success", text: "Demo access updated." });
      // Keeps the server-rendered copy (and `/user-interface`) in step with the edit.
      router.refresh();
    } catch {
      setNotice({
        kind: "error",
        text: "Network error. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <header>
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          Demo Access
        </h2>
        <p className="mt-1.5 text-sm text-night-300">
          Shown in the Demo popover on{" "}
          <a
            href="/user-interface"
            className="font-medium text-brand-400 hover:text-brand-300"
          >
            /user-interface
          </a>
          . Changes save straight to Supabase.
        </p>
      </header>

      {notice ? (
        <p
          role="status"
          className={cn(
            "mt-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            notice.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
        >
          {notice.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {notice.text}
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-brand-500/30 bg-[#0a0a0f] p-6 shadow-card sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor={`${uid}-url`} className={label}>
              URL
            </label>
            <input
              id={`${uid}-url`}
              value={draft.url}
              onChange={(event) => setDraft({ ...draft, url: event.target.value })}
              placeholder="https://195.201.63.176/"
              required
              className={field}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-username`} className={label}>
              Username
            </label>
            <input
              id={`${uid}-username`}
              value={draft.username}
              onChange={(event) => setDraft({ ...draft, username: event.target.value })}
              placeholder="demo"
              required
              className={field}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-password`} className={label}>
              Password
            </label>
            <input
              id={`${uid}-password`}
              value={draft.password}
              onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              placeholder="Demo##123"
              required
              className={field}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {saving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden />
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
