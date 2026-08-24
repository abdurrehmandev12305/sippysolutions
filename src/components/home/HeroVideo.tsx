"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Autoplaying 3D wireframe sphere loop behind the hero text.
 *
 * Mirrors NetworkBackground's loading strategy: mounting is deferred to an
 * idle callback so the browser paints the hero text first instead of
 * competing with a video download, and playback is skipped for users who
 * prefer reduced motion (the first frame is shown as a static image
 * instead). Muted video is exempt from browser autoplay gating, so a plain
 * `play()` call here is enough for silent inline autoplay everywhere,
 * including mobile.
 */

function onIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(task, { timeout: 1000 });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = window.setTimeout(task, 1);
  return () => window.clearTimeout(handle);
}

export function HeroVideo() {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => onIdle(() => setReady(true)), []);

  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    video.play().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <video
      ref={videoRef}
      aria-hidden
      muted
      loop
      playsInline
      preload="metadata"
      className="pointer-events-none absolute inset-0 -z-20 size-full object-cover"
    >
      <source src="/videos/hero-server.mp4" type="video/mp4" />
    </video>
  );
}

export default HeroVideo;
