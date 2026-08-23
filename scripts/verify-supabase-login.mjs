#!/usr/bin/env node
// Verifies that an admin account can sign in through Supabase Auth, using the
// same anon key and the same `signInWithPassword` call the app makes.
//
//   npm run verify:supabase-login
//
// Use it to tell "the credentials are wrong" apart from "the app is broken"
// without opening a browser. Nothing is written and nothing is changed — it
// signs in, reports, and signs straight back out.
//
// The password is read from a masked prompt (never an argument or env var, so
// it can't land in shell history or `ps`) and is never stored anywhere.

import readline from "node:readline";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is not set in .env.local.");
if (!anonKey) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local.");

/** Ordinary echoed prompt — used for the email, which isn't a secret. */
function promptPlain(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (value) => {
      rl.close();
      resolve(value);
    });
  });
}

/**
 * Prompts for input, redrawing the line with `*` in place of whatever readline
 * just echoed. Avoids `setRawMode`, which behaves inconsistently across Windows
 * terminal hosts; this redraw works wherever `readline` itself does.
 */
function promptMasked(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const canMask = process.stdin.isTTY;

    const onKeypress = () => {
      const masked = "*".repeat(rl.line.length);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(query + masked);
      readline.clearLine(process.stdout, 1);
    };

    if (canMask) process.stdin.on("keypress", onKeypress);

    rl.question(query, (value) => {
      if (canMask) process.stdin.off("keypress", onKeypress);
      rl.close();
      resolve(value);
    });
  });
}

if (process.stdin.isTTY) readline.emitKeypressEvents(process.stdin);

console.log("\nChecking an admin sign-in against Supabase Auth…\n");

// The admin address is no longer kept in `.env.local` — the app authenticates
// entirely through Supabase, so nothing at runtime needs to know it. Ask for
// it here rather than reintroducing a variable that exists only for a script.
const email = (await promptPlain("Admin email:    ")).trim();
if (!email) fail("No email entered. Nothing was tested.");

const password = await promptMasked("Admin password: ");
console.log();

if (!password) fail("No password entered. Nothing was tested.");

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.error(`\n  Supabase rejected that sign-in: ${error.message}`);
  console.error(
    "\n  Check the address and password against Dashboard -> Authentication",
  );
  console.error(
    "  -> Users. If the account is right, reset it there with \"Send password",
  );
  console.error("  recovery\". Nothing was changed by this script.\n");
  process.exit(1);
}

console.log("  Supabase Auth accepted that sign-in.");
console.log(`  User id:  ${data.user.id}`);
console.log(`  Email:    ${data.user.email}`);
console.log(`  Role:     ${data.user.role ?? "authenticated"}`);
console.log(
  `  Session:  access token issued, expires in ${data.session.expires_in}s`,
);

await supabase.auth.signOut();

console.log("\n  Signed back out. The hash import is confirmed working.\n");
