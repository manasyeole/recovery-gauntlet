"use client";

import { tintFor, type Step } from "@/lib/steps";
import ChoiceField from "./inputs/ChoiceField";
import ConfirmButton from "./inputs/ConfirmButton";
import HoldButton from "./inputs/HoldButton";
import NumberField from "./inputs/NumberField";
import SliderField from "./inputs/SliderField";
import TextField from "./inputs/TextField";
import type { FieldProps } from "./inputs/types";

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

/** Controls that submit themselves — no Continue button needed. */
const SELF_ADVANCING: ReadonlySet<Step["type"]> = new Set(["choice", "yesno", "confirm", "hold"]);

// The tint cycle lives in lib/steps.ts so the wash behind the card matches.

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
  // A step with a reveal has to wait for the visitor to read the punchline,
  // so it keeps its Continue button.
  const selfAdvancing = SELF_ADVANCING.has(step.type) && !step.reveal;
  const blocked = Boolean(step.required) && value.trim().length === 0;
  const tint = tintFor(step.number);

  return (
    <section
      key={step.number}
      className="card animate-pop-in rounded-chunk p-6 sm:p-9"
      aria-labelledby={`step-${step.number}-question`}
    >
      <span
        aria-hidden
        className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${tint}`}
      >
        {step.emoji}
      </span>

      <h2
        id={`step-${step.number}-question`}
        className="text-balance font-display text-2xl font-bold leading-snug sm:text-[1.75rem]"
      >
        {step.question}
      </h2>

      {step.hint && <p className="muted mt-2.5 text-sm leading-relaxed">{step.hint}</p>}

      <div className="mt-7">
        <Field step={step} value={value} onChange={onChange} onSubmit={onSubmit} />
      </div>

      {(canGoBack || !selfAdvancing) && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="btn-quiet disabled:invisible"
          >
            Back
          </button>

          {!selfAdvancing && (
            <button type="button" onClick={onSubmit} disabled={blocked} className="btn-primary">
              {saving ? "Saving" : isLast ? "Get my certificate" : "Continue"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
