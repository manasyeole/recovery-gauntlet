"use client";

import { useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { sendAnswer } from "@/lib/games/client";
import type { RoomState } from "@/lib/games/protocol";
import RoundTimer from "./RoundTimer";

const LETTERS = ["A", "B", "C", "D"];

/**
 * A live question.
 *
 * The pick is applied optimistically — the button locks the instant it is
 * tapped, because a 200ms round trip on a 20-second clock feels like a bug —
 * and the server's reply then replaces the whole state. If the post fails the
 * optimistic pick is rolled back and the tap is live again.
 */
export default function QuestionStage({
  code,
  game,
  state,
  msLeft,
  onState,
}: {
  code: string;
  game: Game;
  state: RoomState;
  msLeft: number;
  onState: (next: RoomState) => void;
}) {
  const [optimistic, setOptimistic] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const question = state.question;
  const pick = state.viewer?.pick ?? optimistic;
  const locked = pick !== null;

  if (!question) return null;

  async function choose(index: number) {
    if (locked) return;
    setOptimistic(index);
    setError(null);
    try {
      const { state: next } = await sendAnswer(code, question!.round, index);
      onState(next);
    } catch (err) {
      setOptimistic(null);
      setError(err instanceof Error ? err.message : "That didn't go through.");
    }
  }

  const waitingOn = state.players.filter((p) => p.online && !p.answered);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-ink-soft">
          {question.round} / {state.totalRounds}
        </span>
        <RoundTimer msLeft={msLeft} totalMs={state.roundSeconds * 1000} accent={game.accent} />
      </div>

      <section className="card animate-pop-in rounded-chunk p-6 sm:p-8">
        <h1 className="text-balance font-display text-2xl font-bold leading-snug sm:text-[1.75rem]">
          {question.prompt}
        </h1>

        <div className="mt-7 space-y-2.5">
          {question.choices.map((choice, i) => {
            const mine = pick === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={locked}
                aria-pressed={mine}
                className={`choice gap-3 ${mine ? "choice-selected" : ""} ${
                  locked && !mine ? "opacity-40" : ""
                } disabled:cursor-default`}
                style={mine ? { borderColor: game.accent, background: game.tint } : undefined}
              >
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                  style={{
                    background: mine ? game.accent : "var(--paper-tint)",
                    color: mine ? "#fff" : "var(--ink-soft)",
                  }}
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{choice}</span>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <p className="muted text-center text-sm" aria-live="polite">
        {!locked
          ? "Pick one. Faster is worth more."
          : waitingOn.length === 0
            ? "That's everyone."
            : `Locked in. Waiting for ${waitingOn.map((p) => p.name).join(", ")}.`}
      </p>

      {/* Who has answered, without giving away what anyone picked. */}
      <ul className="flex flex-wrap justify-center gap-1.5">
        {state.players.map((p) => (
          <li
            key={p.id}
            title={p.answered ? `${p.name} has answered` : `${p.name} is still thinking`}
            className={`grid h-9 w-9 place-items-center rounded-full border text-lg transition ${
              p.answered ? "" : "opacity-30"
            }`}
            style={{
              borderColor: p.answered ? game.accent : "var(--line)",
              background: p.answered ? game.tint : "var(--card)",
            }}
          >
            <span aria-hidden>{p.emoji}</span>
            <span className="sr-only">
              {p.name} {p.answered ? "has answered" : "has not answered"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
