"use client";

import type { FieldProps } from "./types";

const LETTERS = "ABCDEFGH";

/** Handles both `choice` (list) and `yesno` (two big buttons). */
export default function ChoiceField({ step, value, onChange, onSubmit }: FieldProps) {
  const options = step.type === "yesno" ? ["Yes", "No"] : (step.options ?? []);

  // Picking an option is a complete answer, so advance right after — with a
  // beat of delay so the selected state is actually visible.
  const pick = (opt: string) => {
    onChange(opt);
    window.setTimeout(onSubmit, 260);
  };

  if (step.type === "yesno") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => pick(opt)}
            className={`tap rounded-chunk border px-4 py-7 text-xl font-bold transition active:scale-[0.98] ${
              value === opt ? "choice-selected" : ""
            }`}
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <span className="mr-2 text-2xl" aria-hidden>
              {opt === "Yes" ? "🙋" : "🙅"}
            </span>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-2.5 md:grid-cols-2"
      role="radiogroup"
      aria-label={step.question}
    >
      {options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => pick(opt)}
            className={`choice ${selected ? "choice-selected" : ""}`}
          >
            <span
              aria-hidden
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold transition ${
                selected
                  ? "bg-accent-600 text-white"
                  : "bg-black/5 text-current dark:bg-white/10"
              }`}
            >
              {selected ? "✓" : LETTERS[i]}
            </span>
            <span className="leading-snug">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
