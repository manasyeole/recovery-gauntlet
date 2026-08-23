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
    window.setTimeout(onSubmit, 650);
  }, [onChange, onSubmit, seconds, stopLoop]);

  const tick = useCallback(() => {
    if (startedAt.current === null) return;
    const p = Math.min((performance.now() - startedAt.current) / 1000 / seconds, 1);
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
        aria-label={`Hold for ${seconds} seconds`}
        className="grid h-44 w-44 select-none touch-none place-items-center rounded-full transition disabled:opacity-100"
        style={{
          background: `conic-gradient(var(--clay-500) ${progress * 360}deg, var(--line) 0deg)`,
        }}
      >
        <span className="grid h-[10.5rem] w-[10.5rem] place-items-center rounded-full bg-card">
          {done ? (
            <span className="animate-bounce-check text-4xl" aria-hidden>
              🧘
            </span>
          ) : (
            <span className="font-display text-2xl font-bold tabular-nums">
              {progress > 0 ? (seconds - progress * seconds).toFixed(1) : "Hold"}
            </span>
          )}
        </span>
      </button>

      {bailed && !done && (
        <p className="animate-nudge text-sm font-semibold text-clay-600" role="status">
          You let go. Back to zero.
        </p>
      )}
    </div>
  );
}
