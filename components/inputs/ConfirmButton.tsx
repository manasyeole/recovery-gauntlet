"use client";

import { useState } from "react";
import type { FieldProps } from "./types";

/** One big button for the do-a-dumb-thing steps. */
export default function ConfirmButton({ step, value, onChange, onSubmit }: FieldProps) {
  const [done, setDone] = useState(Boolean(value));

  return (
    <button
      type="button"
      disabled={done}
      onClick={() => {
        setDone(true);
        onChange(step.cta ?? "Confirmed");
        window.setTimeout(onSubmit, 480);
      }}
      className="btn-primary w-full py-5 text-lg"
    >
      {done ? (
        <span className="inline-flex animate-bounce-check items-center gap-2">
          {step.confirmedLabel ?? "Logged ✓"}
        </span>
      ) : (
        (step.cta ?? "I did it")
      )}
    </button>
  );
}
