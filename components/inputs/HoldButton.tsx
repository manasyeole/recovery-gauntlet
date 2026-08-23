"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldProps } from "./types";

/**
 * Press-and-hold for N seconds. Letting go early resets to zero — that's the
 * joke. Driven by requestAnimationFrame off a wall-clock start time so it
 * stays accurate when the tab throttles.
 */
export default function HoldButton({ step, value, onChange, onSubmit }: FieldProps) {
  const seconds = step.holdSeconds ?? 5;
  const [progress, setProgress] = useState(0); // 0..1
  const [done, setDone] = useState(Boolean(value));
  const [bailed, setBailed] = useState(false);

  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const doneRef = useRef(done);
  doneRef.current = done;

  const stopLoop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    startedAt.current = null;
  }, []);

  const finish = useCallback(() => {
    stopLoop();
    setProgress(1);
    setDone(true);
    onChange(`Held still for ${seconds}s`);
    window.setTimeout(onSubmit, 700);
  }, [onChange, onSubmit, seconds, stopLoop]);

  const tick = useCallback(() => {
    if (startedAt.current === null) return;
    const elapsed = (performance.now() - startedAt.current) / 1000;
    const p = Math.min(elapsed / seconds, 1);
    setProgress(p);
    if (p >= 1) {
      finish();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [finish, seconds]);

  const start = useCallback(() => {
    if (doneRef.current || startedAt.current !== null) return;
    setBailed(false);
    startedAt.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const release = useCallback(() => {
    if (doneRef.current || startedAt.current === null) return;
    stopLoop();
    setProgress(0);
    setBailed(true);
  }, [stopLoop]);

  useEffect(() => stopLoop, [stopLoop]);

  const remaining = Math.max(0, seconds - progress * seconds);

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        disabled={done}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture?.(e.pointerId);
          start();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") release();
        }}
        aria-label={`${step.cta ?? "Hold"} for ${seconds} seconds`}
        className="relative grid h-40 w-40 select-none touch-none place-items-center rounded-full border-4 text-center transition disabled:opacity-100 sm:h-48 sm:w-48"
        style={{
          borderColor: done ? "#16a34a" : "var(--line)",
          background: `conic-gradient(theme(colors.accent.500) ${progress * 360}deg, var(--card) 0deg)`,
        }}
      >
        <span
          className="grid h-[calc(100%-1.25rem)] w-[calc(100%-1.25rem)] place-items-center rounded-full px-3"
          style={{ background: "var(--card)" }}
        >
          {done ? (
            <span className="animate-bounce-check text-4xl" aria-hidden>
              🧘
            </span>
          ) : (
            <span className="font-display text-2xl font-extrabold tabular-nums">
              {progress > 0 ? remaining.toFixed(1) : (step.cta ?? "Hold")}
            </span>
          )}
        </span>
      </button>

      <p
        className={`text-center text-sm ${bailed ? "font-semibold text-accent-600 animate-wiggle" : "muted"}`}
        role="status"
      >
        {done
          ? "Verified. You are officially resting."
          : bailed
            ? "You let go. Back to zero. Discipline, please."
            : progress > 0
              ? "Don't you dare let go."
              : `Press and hold for ${seconds} seconds.`}
      </p>
    </div>
  );
}
