"use client";

import { useEffect } from "react";
import type { FieldProps } from "./types";

export default function SliderField({ step, value, onChange }: FieldProps) {
  const min = step.min ?? 1;
  const max = step.max ?? 10;
  const current = value === "" ? Math.round((min + max) / 2) : Number(value);

  // Sliders shouldn't start blank — an untouched slider still has a position,
  // so seed the answer with the midpoint.
  useEffect(() => {
    if (value === "") onChange(String(Math.round((min + max) / 2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.number]);

  const pct = ((current - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-center gap-2">
        <span className="font-display text-6xl font-extrabold tabular-nums text-accent-600">
          {current}
        </span>
        <span className="muted pb-2 text-lg">/ {max}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={current}
        aria-label={step.question}
        onChange={(e) => onChange(e.target.value)}
        style={{ ["--pct" as string]: `${pct}%` }}
      />

      <div className="flex justify-between gap-4 text-xs">
        <span className="muted max-w-[45%] text-left">{step.minLabel ?? min}</span>
        <span className="muted max-w-[45%] text-right">{step.maxLabel ?? max}</span>
      </div>
    </div>
  );
}
