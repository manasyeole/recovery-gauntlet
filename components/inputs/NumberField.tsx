"use client";

import type { FieldProps } from "./types";

const QUICK = [0, 1, 2, 3, 5, 10];

export default function NumberField({ step, value, onChange, onSubmit }: FieldProps) {
  const min = step.min ?? 0;
  const max = step.max ?? 999;
  const n = Number(value);
  const clamp = (x: number) => Math.min(Math.max(x, min), max);

  const bump = (delta: number) =>
    onChange(String(clamp((Number.isFinite(n) && value !== "" ? n : 0) + delta)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => bump(-1)}
          aria-label="Decrease"
          className="tap w-14 shrink-0 rounded-2xl border text-2xl font-bold transition hover:bg-black/5 active:scale-95 dark:hover:bg-white/10"
          style={{ borderColor: "var(--line)" }}
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
          className="field text-center text-3xl font-bold tabular-nums"
        />

        <button
          type="button"
          onClick={() => bump(1)}
          aria-label="Increase"
          className="tap w-14 shrink-0 rounded-2xl border text-2xl font-bold transition hover:bg-black/5 active:scale-95 dark:hover:bg-white/10"
          style={{ borderColor: "var(--line)" }}
        >
          +
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.filter((q) => q >= min && q <= max).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(String(q))}
            className={`tap rounded-full border px-4 text-sm font-medium transition ${
              value === String(q) ? "choice-selected" : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
            style={{ borderColor: "var(--line)" }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
