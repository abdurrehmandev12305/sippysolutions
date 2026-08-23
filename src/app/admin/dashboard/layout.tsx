import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { logout } from "@/app/admin/actions";
import { Container } from "@/components/ui/Container";
import { currentAdmin } from "@/lib/supabase-server";

/**
 * The authorisation boundary for the dashboard. `src/proxy.ts` bounces
 * visitors with no session cookie before they get here, but this check is the
 * one that actually verifies the session — every page nested below is covered
 * by it.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login?callbackUrl=/admin/dashboard");

  return (
    <div className="min-h-[calc(100dvh-16rem)] bg-night-950">
      <div className="border-b border-white/10 bg-[#0a0a0f]">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-night-300">
                Signed in as{" "}
                <span className="font-medium text-night-100">
                  {user.email}
                </span>
              </p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-night-600 bg-white/[0.02] px-5 py-2.5 text-sm font-semibold text-night-100 transition-all duration-200 hover:border-brand-500 hover:bg-brand-500/10 hover:text-white"
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
            </form>
          </div>
        </Container>
      </div>

      <Container className="py-10 sm:py-14">{children}</Container>
    </div>
  );
}
