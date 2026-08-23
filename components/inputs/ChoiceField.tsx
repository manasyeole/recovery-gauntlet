"use client";

import type { FieldProps } from "./types";

/** Handles both `choice` (list) and `yesno` (two big buttons). */
export default function ChoiceField({ step, value, onChange, onSubmit }: FieldProps) {
  const options = step.type === "yesno" ? ["Yes", "No"] : (step.options ?? []);

  // Picking an option is a complete answer, so advance right after — with a
  // beat of delay so the selected state is actually visible. Steps carrying a
  // reveal stay put instead: the punchline is the point, and StepCard gives
  // them a Continue button to leave on.
  const pick = (opt: string) => {
    onChange(opt);
    if (!step.reveal) window.setTimeout(onSubmit, 240);
  };

  // Shown once they've committed to an answer, on steps that have a punchline.
  const reveal =
    step.reveal && value ? (
      <div className="mt-4 animate-pop-in rounded-2xl bg-clay-50 p-4" role="status">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay-600">
          Correct answer
        </p>
        <p className="mt-1 text-[15px] leading-relaxed">{step.reveal}</p>
      </div>
    ) : null;

  if (step.type === "yesno") {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              className={`tap rounded-chunk border border-line bg-card py-7 font-display text-xl font-bold transition active:scale-[0.98] hover:border-clay-300 hover:bg-clay-50 ${
                value === opt ? "choice-selected" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {reveal}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-2.5" role="radiogroup" aria-label={step.question}>
        {options.map((opt) => {
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
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] text-white transition ${
                  selected ? "border-clay-500 bg-clay-500" : "border-line"
                }`}
              >
                {selected ? "✓" : ""}
              </span>
              <span className="leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>
      {reveal}
    </>
  );
}
