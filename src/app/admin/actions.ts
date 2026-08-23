"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * Server Actions behind the admin login form and the dashboard logout button.
 *
 * Sign-in is Supabase Auth (`signInWithPassword`); the session lives in the
 * cookies `@supabase/ssr` writes, and `proxy.ts` keeps it refreshed.
 */

export type LoginState = { error?: string };

const DEFAULT_REDIRECT = "/admin/dashboard";

const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  baseLockoutMs: 30 * 1000,
  maxLockoutMs: 15 * 60 * 1000,
};

/**
 * Only ever bounce back into the admin area. `callbackUrl` arrives from the
 * query string, so an unchecked value would make this an open redirect.
 */
function safeRedirect(value: FormDataEntryValue | null): string {
  const target = typeof value === "string" ? value : "";
  return target.startsWith("/admin/") && !target.startsWith("/admin/login")
    ? target
    : DEFAULT_REDIRECT;
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const target = safeRedirect(formData.get("callbackUrl"));

  if (!email || !password) {
    return { error: "Enter both your email and password." };
  }

  // Keyed by IP alone, not IP+email: there is exactly one admin account, so
  // the email adds no defensive value — but it *is* attacker-controlled, and
  // keying on it would let a script grow the rate-limit store without bound.
  const ip = getClientIp({ headers: await headers() });

  const preCheck = await checkRateLimit("login", ip, LOGIN_RATE_LIMIT);
  if (preCheck.limited) {
    // Same message as a wrong password on purpose: a lockout must not read
    // differently from a plain rejection.
    return { error: "Those credentials weren't recognised. Please try again." };
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordFailure("login", ip, LOGIN_RATE_LIMIT);
    return { error: "Those credentials weren't recognised. Please try again." };
  }

  await recordSuccess("login", ip);

  // `signInWithPassword` has already written the session cookies via `setAll`.
  // `redirect()` throws its control-flow signal, so it has to come last.
  redirect(target);
}

export async function logout(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
