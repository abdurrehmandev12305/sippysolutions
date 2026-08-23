"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated 3D "global connectivity" mesh for the hero background.
 *
 * Deliberately cheap: one BufferGeometry of points plus one LineSegments whose
 * position buffer is rewritten each frame for nodes that are close together.
 * The loop is paused when the canvas leaves the viewport or the tab is hidden,
 * and is skipped entirely for users who prefer reduced motion (a static frame
 * is rendered instead).
 *
 * Setup is deferred to an idle callback (see `onIdle` below) so the WebGL
 * context and buffers are built after the browser has painted the hero text,
 * not competing with it. The render loop itself is capped to a 60fps ceiling
 * — a no-op on the common 60Hz display, but real savings on 120Hz+ hardware,
 * where this cheap-but-uncapped loop was otherwise doing 2x the work for
 * motion this slow and ambient, nobody could actually perceive the difference.
 */

const NODE_COUNT = 90;
const MAX_LINKS = 420;
const LINK_DISTANCE = 2.15;
const FIELD = 9; // cube half-extent the nodes drift inside

/** The render loop never needs to update more often than this. */
const FRAME_INTERVAL_MS = 1000 / 60;

/**
 * Runs `task` once the browser has gone idle, falling back to a short timeout
 * on engines without `requestIdleCallback` (Safari, at the time of writing).
 * Returns a matching canceller so an unmount before the callback fires is a
 * no-op instead of a late, wasted setup.
 */
function onIdle(task: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(task, { timeout: 1000 });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = window.setTimeout(task, 1);
  return () => window.clearTimeout(handle);
}

/** Builds the scene, starts the loop, and returns the full teardown. */
function setupScene(host: HTMLDivElement): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- setup */
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  scene.add(group);

  const camera = new THREE.PerspectiveCamera(
    55,
    host.clientWidth / Math.max(host.clientHeight, 1),
    0.1,
    100,
  );
  camera.position.set(0, 0, 15);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    // No WebGL available — the CSS gradient behind us is a fine fallback.
    return () => {};
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  host.appendChild(renderer.domElement);

  /* ---------------------------------------------------------------- nodes */
  const positions = new Float32Array(NODE_COUNT * 3);
  const velocities = new Float32Array(NODE_COUNT * 3);

  for (let i = 0; i < NODE_COUNT; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * FIELD * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD * 1.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD;

    velocities[i * 3] = (Math.random() - 0.5) * 0.006;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
  }

  const nodeGeometry = new THREE.BufferGeometry();
  nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const nodeMaterial = new THREE.PointsMaterial({
    color: 0x818cf8,
    size: 0.14,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
  group.add(nodes);

  /* ---------------------------------------------------------------- links */
  const linkPositions = new Float32Array(MAX_LINKS * 6);
  const linkGeometry = new THREE.BufferGeometry();
  const linkAttribute = new THREE.BufferAttribute(linkPositions, 3);
  linkAttribute.setUsage(THREE.DynamicDrawUsage);
  linkGeometry.setAttribute("position", linkAttribute);

  const linkMaterial = new THREE.LineBasicMaterial({
    color: 0x4f46e5,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const links = new THREE.LineSegments(linkGeometry, linkMaterial);
  group.add(links);

  /* ------------------------------------------------------------ pointer parallax */
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  const onPointerMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  if (!reducedMotion) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  }

  /* ---------------------------------------------------------------- frame */
  function rebuildLinks() {
    let cursor = 0;

    for (let i = 0; i < NODE_COUNT && cursor < MAX_LINKS; i += 1) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];

      for (let j = i + 1; j < NODE_COUNT && cursor < MAX_LINKS; j += 1) {
        const dx = ix - positions[j * 3];
        const dy = iy - positions[j * 3 + 1];
        const dz = iz - positions[j * 3 + 2];

        if (dx * dx + dy * dy + dz * dz > LINK_DISTANCE * LINK_DISTANCE) continue;

        const offset = cursor * 6;
        linkPositions[offset] = ix;
        linkPositions[offset + 1] = iy;
        linkPositions[offset + 2] = iz;
        linkPositions[offset + 3] = positions[j * 3];
        linkPositions[offset + 4] = positions[j * 3 + 1];
        linkPositions[offset + 5] = positions[j * 3 + 2];
        cursor += 1;
      }
    }

    linkGeometry.setDrawRange(0, cursor * 2);
    linkAttribute.needsUpdate = true;
  }

  function stepNodes() {
    for (let i = 0; i < NODE_COUNT; i += 1) {
      for (let axis = 0; axis < 3; axis += 1) {
        const index = i * 3 + axis;
        positions[index] += velocities[index];

        const bound = axis === 1 ? FIELD * 0.6 : axis === 2 ? FIELD * 0.5 : FIELD;
        if (positions[index] > bound || positions[index] < -bound) {
          velocities[index] *= -1;
        }
      }
    }
    nodeGeometry.attributes.position.needsUpdate = true;
  }

  let frameId = 0;
  let running = false;
  let lastFrameTime = 0;

  function renderFrame() {
    renderer.render(scene, camera);
  }

  function loop(now: number) {
    frameId = requestAnimationFrame(loop);

    // Ceiling at 60fps: on a standard 60Hz display `now` already advances in
    // ~16.7ms steps, so this never skips a tick — the animation runs exactly
    // as before. On a 120Hz+ display it skips every other tick, halving the
    // work with no visible change to motion this slow.
    if (now - lastFrameTime < FRAME_INTERVAL_MS) return;
    lastFrameTime = now;

    stepNodes();
    rebuildLinks();

    pointer.x += (target.x - pointer.x) * 0.03;
    pointer.y += (target.y - pointer.y) * 0.03;

    group.rotation.y += 0.0009;
    group.rotation.x = pointer.y * 0.12;
    group.rotation.z = pointer.x * 0.04;
    camera.position.x = pointer.x * 0.8;
    camera.position.y = -pointer.y * 0.5;
    camera.lookAt(0, 0, 0);

    renderFrame();
  }

  function start() {
    if (running || reducedMotion) return;
    running = true;
    frameId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  // First paint (also the only paint when reduced motion is on).
  rebuildLinks();
  renderFrame();

  /* --------------------------------------------------- visibility + resize */
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      }
    },
    { threshold: 0 },
  );
  observer.observe(host);

  const onVisibilityChange = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibilityChange);

  const resize = () => {
    const width = host.clientWidth;
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderFrame();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  /* -------------------------------------------------------------- cleanup */
  return () => {
    stop();
    observer.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pointermove", onPointerMove);

    nodeGeometry.dispose();
    nodeMaterial.dispose();
    linkGeometry.dispose();
    linkMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

export function NetworkBackground({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let teardown: (() => void) | null = null;

    const cancelIdle = onIdle(() => {
      if (cancelled) return;
      teardown = setupScene(host);
    });

    return () => {
      cancelled = true;
      cancelIdle();
      teardown?.();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={className} />;
}

export default NetworkBackground;
