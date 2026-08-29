"use client";

import { useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { skipPhase } from "@/lib/games/client";
import type { RoomState } from "@/lib/games/protocol";
import Scoreboard from "./Scoreboard";

const LETTERS = ["A", "B", "C", "D"];

/**
 * The answer, who got it, and the standings — the six seconds that make the
 * whole thing worth playing in the same room as other people.
 */
export default function RevealStage({
  code,
  game,
  state,
  onState,
}: {
  code: string;
  game: Game;
  state: RoomState;
  onState: (next: RoomState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { question, reveal, viewer } = state;
  if (!question || !reveal) return null;

  const myPick = viewer ? reveal.picks[viewer.id] ?? -1 : -1;
  const iWasRight = myPick === reveal.correctIndex;
  const gained = viewer ? reveal.gained[viewer.id] ?? 0 : 0;
  const isLast = state.round >= state.totalRounds;

  async function skip() {
    setBusy(true);
    try {
      const { state: next } = await skipPhase(code);
      onState(next);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
        {question.round} / {state.totalRounds}
      </p>

      <section className="card animate-pop-in rounded-chunk p-6 sm:p-8">
        <h1 className="text-balance font-display text-xl font-bold leading-snug sm:text-2xl">
          {question.prompt}
        </h1>

        <div className="mt-6 space-y-2.5">
          {question.choices.map((choice, i) => {
            const isCorrect = i === reveal.correctIndex;
            const wasMine = i === myPick;
            // Who else landed here — the bit people actually look at.
            const others = state.players.filter((p) => reveal.picks[p.id] === i);

            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-base"
                style={{
                  borderColor: isCorrect
                    ? "var(--good)"
                    : wasMine
                      ? "var(--bad)"
                      : "var(--line)",
                  background: isCorrect
                    ? "var(--good-tint)"
                    : wasMine
                      ? "var(--bad-tint)"
                      : "var(--card)",
                  opacity: isCorrect || wasMine || others.length ? 1 : 0.5,
                }}
              >
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                  style={{
                    background: isCorrect
                      ? "var(--good)"
                      : wasMine
                        ? "var(--bad)"
                        : "var(--paper-tint)",
                    color: isCorrect || wasMine ? "#fff" : "var(--ink-soft)",
                  }}
                >
                  {isCorrect ? "✓" : LETTERS[i]}
                </span>

                <span className="flex-1">{choice}</span>

                {/* Never colour alone: the right answer says so in words. */}
                {isCorrect && (
                  <span className="sr-only">Correct answer</span>
                )}

                <span aria-hidden className="shrink-0 text-sm">
                  {others.map((p) => p.emoji).join("")}
                </span>
              </div>
            );
          })}
        </div>

        {reveal.fact && <p className="muted mt-5 text-sm leading-relaxed">{reveal.fact}</p>}
      </section>

      <p
        className="text-center font-display text-lg font-bold"
        aria-live="polite"
        style={{ color: iWasRight ? "var(--good)" : "var(--ink-soft)" }}
      >
        {myPick === -1
          ? "Too slow — no answer went in."
          : iWasRight
            ? `Right. +${gained}`
            : "Not that one."}
      </p>

      <section className="card rounded-chunk p-4 sm:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Standings
        </h2>
        <Scoreboard players={state.players} accent={game.accent} gained={reveal.gained} compact />
      </section>

      {viewer?.isHost && (
        <button type="button" onClick={skip} disabled={busy} className="btn-quiet mx-auto block">
          {isLast ? "Show the final table" : "Next question"}
        </button>
      )}
    </div>
  );
}
