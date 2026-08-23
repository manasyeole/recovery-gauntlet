"use client";

import { TOTAL_STEPS } from "@/lib/steps";

export default function ProgressBar({
  current,
  total = TOTAL_STEPS,
}: {
  current: number;
  total?: number;
}) {
  return (
    <div>
      <p className="muted mb-2 text-xs font-semibold tabular-nums tracking-wide">
        {current} / {total}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Step ${current} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-clay-500 transition-[width] duration-500 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
