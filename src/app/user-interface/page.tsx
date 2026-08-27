import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { DemoButton } from "@/components/user-interface/DemoButton";
import { UserInterfaceHero } from "@/components/user-interface/UserInterfaceHero";
import { ScreenshotGallery } from "@/components/user-interface/ScreenshotGallery";
import { readDemoAccess } from "@/lib/demo-access";
import { readMedia } from "@/lib/media";
import { site } from "@/lib/site";

/**
 * The gallery is cached and re-read from Supabase at most twice a minute, so a
 * visitor is served HTML that already has the thumbnails in it rather than
 * waiting on a query.
 *
 * This is a backstop, not the main path: the User Interface Manager calls
 * `revalidatePath("/user-interface")` on every successful upload, delete and
 * reorder, so a change is live on the next visit rather than on the next tick
 * of this timer. The 30 seconds only bounds how long a change made *outside*
 * the dashboard — a hand edit in the Supabase table editor — can stay
 * invisible.
 */
export const revalidate = 30;

export const metadata: Metadata = {
  title: "User Interface",
  description: `Screenshots of the ${site.name} web console — billing, routing, CDR reporting and real-time monitoring.`,
  alternates: { canonical: "/user-interface" },
};

/**
 * Awaited directly rather than streamed behind a `<Suspense>`: this route is
 * already statically generated (see `revalidate` above), so the whole page —
 * hero, hint and grid alike — is served as one finished HTML response with no
 * request-time gap for a boundary to fill. Wrapping the grid in `<Suspense>`
 * here bought no real streaming benefit and left a fallback/resolved pair of
 * the gallery in the DOM that didn't always swap over correctly on load.
 * `loading.tsx` still covers the client-side-navigation case.
 */
export default async function UserInterfacePage() {
  const [media, demoAccess] = await Promise.all([readMedia(), readDemoAccess()]);

  return (
    <>
      <UserInterfaceHero
        hint={media.length > 0 ? " Tap any screens to view it full size." : null}
      />

      <div className="relative isolate bg-night-950 pb-14 sm:pb-16">
        <Container>
          <div className="flex justify-center">
            <DemoButton access={demoAccess} />
          </div>
        </Container>
      </div>

      <ScreenshotGallery media={media} />
    </>
  );
}
