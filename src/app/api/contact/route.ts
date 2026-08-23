import type { NextRequest } from "next/server";

import { services } from "@/content/services";
import { forbiddenOrigin, isSameOrigin } from "@/lib/csrf";
import { sendContactEmail } from "@/lib/mailer";
import { recordFailure } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

/**
 * Contact form endpoint.
 *
 * Validates the payload, then hands it to `deliver()`, which emails the
 * enquiry over Gmail SMTP (see `@/lib/mailer`). Swapping the backend later —
 * Google Sheets, a CRM webhook, a database insert — only means changing
 * `deliver()`; nothing else on this route has to move.
 */

export type ContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  service: string;
  description: string;
};

const serviceTitles = services.map((service) => service.title);

/** Accepts anything that plausibly looks like `local@domain.tld`. */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Generous caps — real enquiries never get close to these. */
const MAX_LENGTHS = {
  firstName: 100,
  lastName: 100,
  email: 254,
  service: 100,
  description: 5000,
};

/** 5 submissions per hour per IP, escalating on repeat abuse. */
const CONTACT_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
  baseLockoutMs: 5 * 60 * 1000,
  maxLockoutMs: 60 * 60 * 1000,
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Pulls the five known fields out of an untrusted body and reports whatever is
 * missing or malformed. Everything else in the body is dropped.
 */
function parse(body: unknown): { data: ContactPayload } | { errors: string[] } {
  if (typeof body !== "object" || body === null) {
    return { errors: ["Request body must be a JSON object."] };
  }

  const raw = body as Record<string, unknown>;
  const data: ContactPayload = {
    firstName: asTrimmedString(raw.firstName).slice(0, MAX_LENGTHS.firstName),
    lastName: asTrimmedString(raw.lastName).slice(0, MAX_LENGTHS.lastName),
    email: asTrimmedString(raw.email).slice(0, MAX_LENGTHS.email),
    service: asTrimmedString(raw.service).slice(0, MAX_LENGTHS.service),
    description: asTrimmedString(raw.description).slice(0, MAX_LENGTHS.description),
  };

  const errors: string[] = [];
  if (!data.firstName) errors.push("First name is required.");
  if (!data.lastName) errors.push("Last name is required.");
  if (!emailPattern.test(data.email)) errors.push("A valid email is required.");
  if (!serviceTitles.includes(data.service)) errors.push("Choose a service.");
  if (!data.description) errors.push("Description is required.");

  return errors.length > 0 ? { errors } : { data };
}

/**
 * Hand the enquiry off to a backend.
 *
 * Throwing from here makes the route answer 502, so the visitor sees a failure
 * instead of a false success.
 */
async function deliver(payload: ContactPayload): Promise<void> {
  await sendContactEmail(payload);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const ip = getClientIp(request);
  const rateLimit = await recordFailure("contact", ip, CONTACT_RATE_LIMIT);
  if (rateLimit.limited) {
    return Response.json(
      { ok: false, errors: ["Too many submissions. Please try again later."] },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, errors: ["Request body must be valid JSON."] },
      { status: 400 },
    );
  }

  const result = parse(body);
  if ("errors" in result) {
    return Response.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  try {
    await deliver(result.data);
  } catch (error) {
    console.error("[contact] delivery failed", error);
    return Response.json(
      { ok: false, errors: ["We couldn't send your message. Please try again."] },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    message: "Thanks — your message has been received. We'll be in touch shortly.",
  });
}
