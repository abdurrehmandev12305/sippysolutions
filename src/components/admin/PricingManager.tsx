"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { Plan, Spec } from "@/lib/pricing";

const ENDPOINT = "/api/admin/pricing";

const field =
  "w-full rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-night-400 transition-colors hover:border-night-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60";

const label =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-night-300";

/** A plan being edited. `price` stays a string so the input can be emptied. */
type Draft = {
  id: string | null;
  name: string;
  specs: Spec[];
  location: string;
  flag: string;
  currency: string;
  price: string;
  period: string;
};

/** The four rows every plan on this site currently lists. */
const BLANK_SPECS: Spec[] = [
  { label: "CPU", value: "" },
  { label: "Drive", value: "" },
  { label: "RAM", value: "" },
  { label: "Bandwidth", value: "" },
];

function blankDraft(): Draft {
  return {
    id: null,
    name: "",
    specs: BLANK_SPECS.map((spec) => ({ ...spec })),
    location: "Germany",
    flag: "🇩🇪",
    currency: "€",
    price: "",
    period: "Per Month",
  };
}

function toDraft(plan: Plan): Draft {
  return {
    id: plan.id,
    name: plan.name,
    specs: plan.specs.map((spec) => ({ ...spec })),
    location: plan.location,
    flag: plan.flag,
    currency: plan.currency,
    price: String(plan.price),
    period: plan.period,
  };
}

type Notice = { kind: "success" | "error"; text: string } | null;

export function PricingManager({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const uid = useId();

  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const editing = draft?.id != null;

  /** Applies a server response: refresh local state and the RSC cache. */
  function applyPlans(next: Plan[], text: string) {
    setPlans(next);
    setNotice({ kind: "success", text });
    // Keeps the server-rendered copy (and `/pricing`) in step with the edit.
    router.refresh();
  }

  function fail(errors: string[] | undefined, fallback: string) {
    setNotice({ kind: "error", text: errors?.join(" ") ?? fallback });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    setSaving(true);
    setNotice(null);

    const payload = {
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name,
      specs: draft.specs,
      location: draft.location,
      flag: draft.flag,
      currency: draft.currency,
      price: draft.price,
      period: draft.period,
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: { ok?: boolean; plans?: Plan[]; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.plans) {
        fail(result.errors, "Couldn't save that plan. Please try again.");
        return;
      }

      applyPlans(
        result.plans,
        draft.id ? "Plan updated." : `“${draft.name}” added.`,
      );
      setDraft(null);
    } catch {
      setNotice({
        kind: "error",
        text: "Network error. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(plan: Plan) {
    setPendingId(plan.id);
    setNotice(null);

    try {
      const response = await fetch(
        `${ENDPOINT}?id=${encodeURIComponent(plan.id)}`,
        { method: "DELETE" },
      );

      const result: { ok?: boolean; plans?: Plan[]; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.plans) {
        fail(result.errors, "Couldn't delete that plan. Please try again.");
        return;
      }

      applyPlans(result.plans, `“${plan.name}” deleted.`);
      // Drop the editor if it was open on the plan that just vanished.
      if (draft?.id === plan.id) setDraft(null);
    } catch {
      setNotice({
        kind: "error",
        text: "Network error. Check your connection and try again.",
      });
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  function patchSpec(index: number, patch: Partial<Spec>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            specs: current.specs.map((spec, i) =>
              i === index ? { ...spec, ...patch } : spec,
            ),
          }
        : current,
    );
  }

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            Pricing Manager
          </h2>
          <p className="mt-1.5 text-sm text-night-300">
            {plans.length} {plans.length === 1 ? "plan" : "plans"} live on{" "}
            <a
              href="/pricing"
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              /pricing
            </a>
            . Changes save straight to Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDraft(blankDraft());
            setNotice(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0"
        >
          <Plus className="size-4" aria-hidden />
          Add plan
        </button>
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

      {/* ---- Editor -------------------------------------------------------- */}
      {draft ? (
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-brand-500/30 bg-[#0a0a0f] p-6 shadow-card sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">
              {editing ? "Edit plan" : "New plan"}
            </h3>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="grid size-9 place-items-center rounded-lg border border-night-700 text-night-300 transition-colors hover:border-night-500 hover:text-white"
              aria-label="Close editor"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-name`} className={label}>
                Plan name
              </label>
              <input
                id={`${uid}-name`}
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="Concurrent Calls 50"
                required
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-location`} className={label}>
                Server location
              </label>
              <input
                id={`${uid}-location`}
                value={draft.location}
                onChange={(event) =>
                  setDraft({ ...draft, location: event.target.value })
                }
                placeholder="Germany"
                required
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-flag`} className={label}>
                Flag emoji <span className="normal-case">(optional)</span>
              </label>
              <input
                id={`${uid}-flag`}
                value={draft.flag}
                onChange={(event) =>
                  setDraft({ ...draft, flag: event.target.value })
                }
                placeholder="🇩🇪"
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-price`} className={label}>
                Price
              </label>
              {/* `field` carries `w-full`, so widths are set on wrappers —
                  a `w-16` on the input itself would collide with it. */}
              <div className="flex gap-2">
                <div className="w-16 shrink-0">
                  <input
                    aria-label="Currency symbol"
                    value={draft.currency}
                    onChange={(event) =>
                      setDraft({ ...draft, currency: event.target.value })
                    }
                    placeholder="€"
                    className={cn(field, "px-2 text-center")}
                  />
                </div>
                <div className="flex-1">
                  <input
                    id={`${uid}-price`}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={draft.price}
                    onChange={(event) =>
                      setDraft({ ...draft, price: event.target.value })
                    }
                    placeholder="80"
                    required
                    className={field}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor={`${uid}-period`} className={label}>
                Billing period
              </label>
              <input
                id={`${uid}-period`}
                value={draft.period}
                onChange={(event) =>
                  setDraft({ ...draft, period: event.target.value })
                }
                placeholder="Per Month"
                className={field}
              />
            </div>
          </div>

          {/* Specs ---------------------------------------------------------- */}
          <fieldset className="mt-7">
            <legend className={cn(label, "mb-3")}>Specs</legend>

            <div className="space-y-3">
              {draft.specs.map((spec, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-32 shrink-0 sm:w-44">
                    <input
                      aria-label={`Spec ${index + 1} label`}
                      value={spec.label}
                      onChange={(event) =>
                        patchSpec(index, { label: event.target.value })
                      }
                      placeholder="CPU"
                      className={field}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      aria-label={`Spec ${index + 1} value`}
                      value={spec.value}
                      onChange={(event) =>
                        patchSpec(index, { value: event.target.value })
                      }
                      placeholder="Intel Xeon E3-1246V3"
                      className={field}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        specs: draft.specs.filter((_, i) => i !== index),
                      })
                    }
                    className="grid size-[46px] shrink-0 place-items-center rounded-xl border border-night-700 text-night-300 transition-colors hover:border-red-500/60 hover:text-red-300"
                    aria-label={`Remove spec ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  specs: [...draft.specs, { label: "", value: "" }],
                })
              }
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-200 transition-colors hover:border-brand-500 hover:text-white"
            >
              <Plus className="size-3.5" aria-hidden />
              Add spec row
            </button>

            <p className="mt-3 text-xs text-night-400">
              Location is rendered as the final row on the card automatically —
              no need to add it here.
            </p>
          </fieldset>

          <div className="mt-8 flex flex-wrap gap-3">
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
                  {editing ? "Save changes" : "Create plan"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-night-600 px-7 py-3 text-sm font-semibold text-night-100 transition-colors hover:border-night-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* ---- Plan list ----------------------------------------------------- */}
      <div className="mt-8 space-y-3">
        {plans.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-6 py-10 text-center text-sm text-night-300">
            No plans yet. Use <strong className="text-white">Add plan</strong> to
            create the first one.
          </p>
        ) : (
          plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "rounded-2xl border bg-[#0a0a0f] p-5 transition-colors sm:p-6",
                draft?.id === plan.id
                  ? "border-brand-500/60"
                  : "border-white/10 hover:border-white/20",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>

                  <p className="mt-1 text-sm font-semibold text-brand-400">
                    {plan.currency}
                    {plan.price}{" "}
                    <span className="font-medium text-night-400">
                      {plan.period}
                    </span>
                    <span className="ml-2 font-medium text-night-400">
                      · {plan.location} {plan.flag}
                    </span>
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-night-300">
                    {plan.specs.map((spec) => (
                      <li key={spec.label}>
                        <span className="text-night-400">{spec.label}:</span>{" "}
                        {spec.value}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(toDraft(plan));
                      setConfirmingId(null);
                      setNotice(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-100 transition-colors hover:border-brand-500 hover:text-white"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </button>

                  {confirmingId === plan.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onDelete(plan)}
                        disabled={pendingId === plan.id}
                        className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingId === plan.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden />
                        )}
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="inline-flex items-center rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-200 transition-colors hover:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(plan.id);
                        setNotice(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-100 transition-colors hover:border-red-500/60 hover:text-red-300"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
