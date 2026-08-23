import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/admin/LoginForm";
import { Container } from "@/components/ui/Container";
import { currentAdmin } from "@/lib/supabase-server";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admin Login",
  description: `Sign in to the ${site.name} admin panel.`,
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Already signed in? Skip the form.
  if (await currentAdmin()) redirect("/admin/dashboard");

  const { callbackUrl } = await searchParams;

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-16rem)] items-center overflow-hidden bg-night-950 py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/10 blur-[130px]"
      />

      <Container>
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0f] p-7 shadow-card sm:p-9">
            <div className="mb-8 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
                <ShieldCheck className="size-6" aria-hidden />
              </span>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
                Admin Login
              </h1>
              <p className="mt-2 text-sm text-night-300">
                Sign in to manage {site.name} pricing.
              </p>
            </div>

            <LoginForm callbackUrl={callbackUrl ?? "/admin/dashboard"} />
          </div>
        </div>
      </Container>
    </section>
  );
}
