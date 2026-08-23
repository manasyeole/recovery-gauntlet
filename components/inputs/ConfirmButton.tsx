"use client";

import { useState } from "react";
import type { FieldProps } from "./types";

/** One big "I did it" button for the do-a-dumb-thing steps. */
export default function ConfirmButton({ step, value, onChange, onSubmit }: FieldProps) {
  const [done, setDone] = useState(Boolean(value));

  const confirm = () => {
    setDone(true);
    onChange(step.cta ?? "Confirmed");
    window.setTimeout(onSubmit, 500);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={confirm}
        disabled={done}
        className="btn-primary w-full px-8 py-5 text-lg sm:w-auto"
      >
        {done ? (
          <>
            <span className="inline-block animate-bounce-check" aria-hidden>
              ✅
            </span>
            Logged. Respect.
          </>
        ) : (
          <>
            <span aria-hidden>👉</span>
            {step.cta ?? "I did it"}
          </>
        )}
      </button>
      {!done && <p className="muted text-center text-xs">No, really. Out loud. We&apos;ll wait.</p>}
    </div>
  );
}
