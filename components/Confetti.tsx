"use client";

import { useCallback } from "react";

/** True when the visitor has asked the OS for less motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Burst = "small" | "big";

/**
 * canvas-confetti is loaded lazily so it never lands in the initial bundle,
 * and is skipped entirely under prefers-reduced-motion — nobody mid-recovery
 * needs a screen full of bouncing paper.
 */
async function fire(kind: Burst) {
  if (prefersReducedMotion()) return;
  const confetti = (await import("canvas-confetti")).default;

  if (kind === "small") {
    confetti({
      particleCount: 45,
      spread: 62,
      startVelocity: 32,
      origin: { y: 0.72 },
      scalar: 0.9,
      disableForReducedMotion: true,
    });
    return;
  }

  const shots = [
    { particleCount: 90, spread: 100, origin: { x: 0.2, y: 0.7 } },
    { particleCount: 90, spread: 100, origin: { x: 0.8, y: 0.7 } },
    { particleCount: 140, spread: 130, origin: { x: 0.5, y: 0.55 }, startVelocity: 45 },
  ];
  shots.forEach((s, i) =>
    setTimeout(() => confetti({ ...s, disableForReducedMotion: true }), i * 180)
  );
}

/** `const burst = useConfetti(); burst("big")` */
export function useConfetti() {
  return useCallback((kind: Burst = "small") => {
    void fire(kind);
  }, []);
}

export default useConfetti;
