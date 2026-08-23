import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session refresh + the gate on `/admin/dashboard`.
 *
 * 1. Refresh. Access tokens are short-lived; without a refresh per request the
 *    admin gets signed out mid-session. Rotated cookies must be written onto
 *    the *same* response that gets returned — hence the rebuild inside
 *    `setAll` rather than a response created once up front.
 *
 * 2. Gate. Bounce a visitor with no valid session. `dashboard/layout.tsx` calls
 *    `currentAdmin()` and stays the real authorisation boundary; this only
 *    avoids rendering the shell first. API routes answer 401 themselves, so
 *    they are refreshed but never redirected — a fetch should not receive a
 *    login page.
 */

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed: without Supabase configured nothing can be authorised.
  if (!url || !key) {
    console.error("[proxy] Supabase env vars are missing — refusing access.");
    return NextResponse.redirect(new URL("/admin/login", request.nextUrl));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value } of list) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Revalidates the JWT and rotates cookies when due. Must not be skipped or
  // short-circuited — this call is what keeps the session alive.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith("/api/")) {
    const login = new URL("/admin/login", request.nextUrl);
    login.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  // `/admin/login` stays outside the matcher — redirecting it here would loop.
  matcher: ["/admin/dashboard/:path*", "/api/admin/:path*"],
};
