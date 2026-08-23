"use client";

import type { FieldProps } from "./types";

export const GUESS_SEP = " · ";
const SEP = GUESS_SEP;

/** Every box filled? Continue stays blocked until then, so the reveal lands. */
export function guessesComplete(step: { guessCount?: number }, value: string): boolean {
  const count = step.guessCount ?? 3;
  const parts = value.split(SEP);
  return Array.from({ length: count }, (_, i) => parts[i] ?? "").every(
    (g) => g.trim().length > 0
  );
}

/**
 * A row of text boxes for a step whose answer is a set of guesses, followed by
 * the punchline once they've filled all of them in. Every guess is wrong by
 * design — see `reveal` on the step.
 *
 * The whole set is stored as one separator-joined string, so it still reads
 * fine in the admin table and on the certificate.
 */
export default function GuessField({ step, value, onChange, onSubmit }: FieldProps) {
  const count = step.guessCount ?? 3;

  const guesses = Array.from({ length: count }, (_, i) => value.split(SEP)[i] ?? "");
  const allFilled = guesses.every((g) => g.trim().length > 0);

  const setGuess = (index: number, next: string) => {
    const updated = [...guesses];
    updated[index] = next;
    // Trailing blanks would leave stray separators in the stored answer.
    while (updated.length && updated[updated.length - 1].trim() === "") updated.pop();
    onChange(updated.join(SEP));
  };

  return (
    <>
      <div className="grid gap-2.5">
        {guesses.map((guess, i) => (
          <input
            key={i}
            type="text"
            value={guess}
            onChange={(e) => setGuess(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              // Enter walks down the boxes, then submits from the last one.
              const next = e.currentTarget.parentElement?.children[i + 1];
              if (next instanceof HTMLInputElement) next.focus();
              else if (allFilled && !step.reveal) onSubmit();
            }}
            placeholder={`Guess ${i + 1}`}
            aria-label={`${step.question} — guess ${i + 1}`}
            maxLength={60}
            className="field"
          />
        ))}
      </div>

      {step.reveal && allFilled && (
        <div className="mt-4 animate-pop-in rounded-2xl bg-clay-50 p-4" role="status">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay-600">
            Correct answer
          </p>
          <p className="mt-1 text-[15px] leading-relaxed">{step.reveal}</p>
        </div>
      )}
    </>
  );
}
