"use client";

import { useEffect } from "react";
import type { FieldProps } from "./types";

export default function SliderField({ step, value, onChange }: FieldProps) {
  const min = step.min ?? 1;
  const max = step.max ?? 10;
  const current = value === "" ? Math.round((min + max) / 2) : Number(value);

  // An untouched slider still has a position, so seed the answer with the
  // midpoint rather than leaving it blank.
  useEffect(() => {
    if (value === "") onChange(String(Math.round((min + max) / 2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.number]);

  return (
    <div>
      <p className="text-center font-display text-6xl font-bold tabular-nums text-clay-500">
        {current}
      </p>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={current}
        aria-label={step.question}
        onChange={(e) => onChange(e.target.value)}
        style={{ ["--pct" as string]: `${((current - min) / (max - min)) * 100}%` }}
        className="mt-2"
      />

      <div className="flex justify-between gap-6 text-xs">
        <span className="muted max-w-[45%]">{step.minLabel ?? min}</span>
        <span className="muted max-w-[45%] text-right">{step.maxLabel ?? max}</span>
      </div>
    </div>
  );
}
