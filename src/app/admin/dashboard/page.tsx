import type { Metadata } from "next";

import { MediaManager } from "@/components/admin/MediaManager";
import { PricingManager } from "@/components/admin/PricingManager";
import { readMedia } from "@/lib/media";
import { readPlans } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// The plan list and the gallery are read from Supabase per request — never
// served from a cache.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [plans, media] = await Promise.all([readPlans(), readMedia()]);

  return (
    <div className="space-y-14">
      <PricingManager initialPlans={plans} />

      <hr className="border-white/10" />

      <MediaManager initialMedia={media} />
    </div>
  );
}
