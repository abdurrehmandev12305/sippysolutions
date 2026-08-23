"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Send } from "lucide-react";

import { cn } from "@/lib/cn";
import { services } from "@/content/services";

type Status = "idle" | "submitting" | "success" | "error";

/** Shared look for every input, select and textarea in the form. */
const field =
  "w-full rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-night-400 transition-colors hover:border-night-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60";

const label =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-night-300";

export function ContactForm() {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submitting = status === "submitting";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const firstName = (data.get("firstName") as string || "").trim();
    const lastName = (data.get("lastName") as string || "").trim();
    const email = (data.get("email") as string || "").trim();
    const service = (data.get("service") as string || "").trim();
    const description = (data.get("description") as string || "").trim();

    if (!firstName || !lastName || !email || !service || !description) {
      setStatus("error");
      setMessage("Please fill in all the details.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          service,
          description,
        }),
      });

      const result: { ok?: boolean; message?: string; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(
          result.errors?.join(" ") ??
            "Something went wrong. Please try again in a moment.",
        );
        return;
      }

      setStatus("success");
      setMessage("Form submitted successfully! We'll get back to you soon.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Network error. Please check your connection and try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border border-night-700 bg-night-900/60 p-6 shadow-card backdrop-blur-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-first`} className={label}>
            First Name
          </label>
          <input
            id={`${uid}-first`}
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="John"
            disabled={submitting}
            className={field}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-last`} className={label}>
            Last Name
          </label>
          <input
            id={`${uid}-last`}
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Doe"
            disabled={submitting}
            className={field}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={`${uid}-email`} className={label}>
          Email
        </label>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          disabled={submitting}
          className={field}
        />
      </div>

      <div className="mt-5">
        <label htmlFor={`${uid}-service`} className={label}>
          Choose Services
        </label>
        <div className="relative">
          <select
            id={`${uid}-service`}
            name="service"
            required
            defaultValue=""
            disabled={submitting}
            className={cn(field, "appearance-none pr-11")}
          >
            <option value="" disabled className="bg-night-900 text-night-400">
              Select a service…
            </option>
            {services.map((service) => (
              <option
                key={service.title}
                value={service.title}
                className="bg-night-900 text-white"
              >
                {service.title}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-night-400"
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={`${uid}-description`} className={label}>
          Description
        </label>
        <textarea
          id={`${uid}-description`}
          name="description"
          rows={6}
          required
          placeholder="Tell us about your project, traffic volumes and what you need from the platform."
          disabled={submitting}
          className={cn(field, "resize-y")}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden />
            Submit
          </>
        )}
      </button>

      {/* Result banner — polite so screen readers announce it without stealing focus. */}
      <p aria-live="polite" className="sr-only">
        {status === "success" || status === "error" ? message : ""}
      </p>

      {message && (status === "success" || status === "error") ? (
        <div
          className={cn(
            "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            status === "success"
              ? "border-brand-500/40 bg-brand-500/10 text-brand-200"
              : "border-red-500/40 bg-red-500/10 text-red-200",
          )}
        >
          {status === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span>{message}</span>
        </div>
      ) : null}
    </form>
  );
}
