"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, LoaderCircle, LogIn } from "lucide-react";

import { login, type LoginState } from "@/app/admin/actions";

const field =
  "w-full rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-night-400 transition-colors hover:border-night-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60";

const label =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-night-300";

/** Split out so `useFormStatus` can read the parent form's pending state. */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Signing in…
        </>
      ) : (
        <>
          <LogIn className="size-4" aria-hidden />
          Sign in
        </>
      )}
    </button>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const uid = useId();
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <label htmlFor={`${uid}-email`} className={label}>
          Email
        </label>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="admin@sippysolution.com"
          className={field}
        />
      </div>

      <div>
        <label htmlFor={`${uid}-password`} className={label}>
          Password
        </label>
        <input
          id={`${uid}-password`}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={field}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
