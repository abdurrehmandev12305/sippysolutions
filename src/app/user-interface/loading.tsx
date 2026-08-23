import { UserInterfaceHero } from "@/components/user-interface/UserInterfaceHero";
import { ScreenshotGallerySkeleton } from "@/components/user-interface/ScreenshotGallerySkeleton";

/**
 * Navigation fallback for `/user-interface`.
 *
 * It reuses the real hero and the same grid skeleton the page streams behind
 * its `<Suspense>` boundary, so arriving here from a client-side navigation
 * looks identical to arriving on a cold load. The hero's `hint` is left off:
 * whether the gallery has items is exactly the thing not yet known here.
 */
export default function Loading() {
  return (
    <>
      <UserInterfaceHero />
      <ScreenshotGallerySkeleton />
    </>
  );
}
