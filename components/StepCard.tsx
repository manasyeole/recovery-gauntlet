"use client";

import type { Step } from "@/lib/steps";
import ChoiceField from "./inputs/ChoiceField";
import ConfirmButton from "./inputs/ConfirmButton";
import HoldButton from "./inputs/HoldButton";
import NumberField from "./inputs/NumberField";
import SliderField from "./inputs/SliderField";
import TextField from "./inputs/TextField";
import type { FieldProps } from "./inputs/types";

const KIND_BADGE: Record<Step["kind"], { label: string; className: string }> = {
  greeting: { label: "Welcome", className: "bg-accent-100 text-accent-800" },
  tease: { label: "Roast", className: "bg-orange-100 text-orange-800" },
  question: { label: "Question", className: "bg-sky-100 text-sky-800" },
  activity: { label: "Prove it", className: "bg-emerald-100 text-emerald-800" },
  closing: { label: "Final step", className: "bg-violet-100 text-violet-800" },
};

const FIELDS: Record<Step["type"], (p: FieldProps) => React.JSX.Element> = {
  text: TextField,
  longtext: TextField,
  number: NumberField,
  slider: SliderField,
  choice: ChoiceField,
  yesno: ChoiceField,
  confirm: ConfirmButton,
  hold: HoldButton,
};

/** Controls that submit themselves — no "Continue" button needed. */
const SELF_ADVANCING: ReadonlySet<Step["type"]> = new Set(["choice", "yesno", "confirm", "hold"]);

interface Props extends FieldProps {
  onBack?: () => void;
  canGoBack: boolean;
  isLast: boolean;
  saving?: boolean;
}

export default function StepCard({
  step,
  value,
  onChange,
  onSubmit,
  onBack,
  canGoBack,
  isLast,
  saving,
}: Props) {
  const Field = FIELDS[step.type];
  const badge = KIND_BADGE[step.kind];
  const selfAdvancing = SELF_ADVANCING.has(step.type);
  const answered = value.trim().length > 0;
  const blocked = Boolean(step.required) && !answered;

  return (
    <section
      key={step.number}
      className="card animate-pop-in rounded-chunk p-5 shadow-chunk sm:p-7 md:p-9 dark:shadow-chunk-dark"
      aria-labelledby={`step-${step.number}-question`}
    >
      <header className="mb-5 flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden
          className="animate-float grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-50 text-2xl sm:h-14 sm:w-14 sm:text-3xl dark:bg-accent-900/40"
        >
          {step.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <span
            className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badge.className} dark:brightness-90`}
          >
            {badge.label}
          </span>
          <h2
            id={`step-${step.number}-question`}
            className="text-balance text-xl font-bold leading-snug sm:text-2xl md:text-[1.7rem]"
          >
            {step.question}
          </h2>
          {step.hint && <p className="muted mt-2 text-sm leading-relaxed">{step.hint}</p>}
        </div>
      </header>

      <div className="mt-6">
        <Field step={step} value={value} onChange={onChange} onSubmit={onSubmit} />
      </div>

      <footer className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="btn-ghost muted disabled:invisible"
        >
          ← Back
        </button>

        {selfAdvancing ? (
          <span className="muted text-xs">
            {step.required ? "Pick one to continue" : "Or skip with the arrow keys"}
          </span>
        ) : (
          <button type="button" onClick={onSubmit} disabled={blocked} className="btn-primary">
            {saving ? "Saving…" : isLast ? "Get my certificate 🎓" : "Continue"}
            {!saving && !isLast && <span aria-hidden>→</span>}
          </button>
        )}
      </footer>

      {!step.required && !selfAdvancing && (
        <p className="muted mt-3 text-right text-xs">
          Optional — leave it blank and hit Continue if you must.
        </p>
      )}
    </section>
  );
}
