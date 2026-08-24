import type { Metadata } from "next";

import { MediaManager } from "@/components/admin/MediaManager";
import { NewsManager } from "@/components/admin/NewsManager";
import { PricingManager } from "@/components/admin/PricingManager";
import { readMedia } from "@/lib/media";
import { readPosts } from "@/lib/news";
import { readPlans } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// The plan list, gallery and post list are read from Supabase per request —
// never served from a cache.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [plans, media, posts] = await Promise.all([
    readPlans(),
    readMedia(),
    readPosts(),
  ]);

  return (
    <div className="space-y-14">
      <PricingManager initialPlans={plans} />

      <hr className="border-white/10" />

      <MediaManager initialMedia={media} />

      <hr className="border-white/10" />

      <NewsManager initialPosts={posts} />
    </div>
  );
}
