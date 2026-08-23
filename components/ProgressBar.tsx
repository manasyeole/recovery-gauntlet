"use client";

import { TOTAL_STEPS } from "@/lib/steps";

interface Props {
  current: number;
  total?: number;
}

export default function ProgressBar({ current, total = TOTAL_STEPS }: Props) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-display text-base font-bold">
          Step {current}{" "}
          <span className="muted font-body text-sm font-normal">of {total}</span>
        </span>
        <span className="muted tabular-nums">{pct}%</span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--line)" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Step ${current} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Dot rail: too noisy on phones, genuinely useful on desktop. */}
      <div className="mt-3 hidden gap-1.5 md:flex">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span
            key={n}
            aria-hidden
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              n < current
                ? "bg-accent-400"
                : n === current
                  ? "bg-accent-600"
                  : "bg-black/10 dark:bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
