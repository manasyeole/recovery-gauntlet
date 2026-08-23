"use client";

import type { FieldProps } from "./types";

export default function NumberField({ step, value, onChange, onSubmit }: FieldProps) {
  const min = step.min ?? 0;
  const max = step.max ?? 999;
  const n = Number(value);
  const clamp = (x: number) => Math.min(Math.max(x, min), max);
  const bump = (d: number) =>
    onChange(String(clamp((Number.isFinite(n) && value !== "" ? n : 0) + d)));

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => bump(-1)}
        aria-label="Decrease"
        className="tap w-14 shrink-0 rounded-2xl border border-line bg-card text-2xl transition hover:bg-paper-tint active:scale-95"
      >
        −
      </button>

      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        placeholder={step.placeholder}
        aria-label={step.question}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="field text-center font-display text-3xl font-bold tabular-nums"
      />

      <button
        type="button"
        onClick={() => bump(1)}
        aria-label="Increase"
        className="tap w-14 shrink-0 rounded-2xl border border-line bg-card text-2xl transition hover:bg-paper-tint active:scale-95"
      >
        +
      </button>
    </div>
  );
}
