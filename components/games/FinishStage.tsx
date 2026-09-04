"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useConfetti } from "@/components/Confetti";
import type { Game } from "@/lib/games/catalog";
import { findEvent } from "@/lib/games/cards";
import { rematch } from "@/lib/games/client";
import type { DuelState } from "@/lib/games/protocol";

/**
 * How it ended, and the round-by-round to argue about afterwards.
 *
 * A duel can end three ways — knockout, on health when the rounds run out, or
 * level — and the headline says which, because "you won" without saying how
 * is the kind of thing people replay the last round over.
 */
export default function FinishStage({
  code,
  game,
  state,
  onState,
}: {
  code: string;
  game: Game;
  state: DuelState;
  onState: (next: DuelState) => void;
}) {
  const burst = useConfetti();
  const fired = useRef(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const you = state.duelists.find((d) => d.isYou);
  const them = state.duelists.find((d) => !d.isYou);
  const draw = state.winnerSeat === -1;
  const won = !draw && you?.seat === state.winnerSeat;

  useEffect(() => {
    if (won && !fired.current) {
      fired.current = true;
      burst("big");
    }
  }, [won, burst]);

  const knockout = (you?.hp ?? 1) <= 0 || (them?.hp ?? 1) <= 0;
  const headline = draw
    ? "Level"
    : won
      ? knockout
        ? "Knockout"
        : "You win on health"
      : knockout
        ? "Knocked out"
        : `${them?.name ?? "They"} win on health`;

  const isHost = state.viewer?.isHost ?? false;

  async function again() {
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await rematch(code);
      onState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a rematch.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="card rounded-chunk p-6 text-center sm:p-8">
        <span aria-hidden className="block text-5xl">
          {draw ? "🤝" : won ? "🏆" : game.emoji}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold" style={{ color: game.ink }}>
          {headline}
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[you, them].map((d, i) =>
            d ? (
              <div
                key={d.id}
                className="rounded-2xl border p-3"
                style={{
                  borderColor: d.seat === state.winnerSeat ? game.accent : "var(--line)",
                  background: d.seat === state.winnerSeat ? game.tint : "var(--card)",
                }}
              >
                <p className="text-sm font-semibold">
                  <span aria-hidden className="mr-1">
                    {d.emoji}
                  </span>
                  {i === 0 ? "You" : d.name}
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                  {d.hp}
                  <span className="muted text-sm font-normal"> hp</span>
                </p>
                <p className="muted mt-0.5 text-xs tabular-nums">
                  {d.damageDealt} damage · {d.roundsWon} rounds
                </p>
              </div>
            ) : null
          )}
        </div>
      </section>

      {/* ------------------------------ the log --------------------------- */}
      {state.log.length > 0 && (
        <section className="card rounded-chunk p-5" aria-labelledby="log-heading">
          <h2 id="log-heading" className="mb-3 text-sm font-semibold">
            Round by round
          </h2>
          <ul className="space-y-1.5">
            {state.log.map((line) => {
              const event = line.eventId ? findEvent(state.gameSlug, line.eventId) : undefined;
              const yourSeat = you?.seat ?? 0;
              const theirSeat = yourSeat === 0 ? 1 : 0;
              return (
                <li key={line.round} className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="muted w-8 shrink-0 font-semibold">R{line.round}</span>
                  <span className="w-16 shrink-0 font-semibold" style={{ color: "var(--good)" }}>
                    −{line.dealt[yourSeat]}
                  </span>
                  <span className="w-16 shrink-0 font-semibold" style={{ color: "var(--bad)" }}>
                    −{line.dealt[theirSeat]}
                  </span>
                  <span className="muted truncate">
                    {event ? `${event.emoji} ${event.name}` : ""}
                  </span>
                  <span className="muted ml-auto shrink-0">
                    {line.hp[yourSeat]} / {line.hp[theirSeat]}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="muted mt-3 text-[0.65rem]">
            Damage you dealt, damage you took, health left after.
          </p>
        </section>
      )}

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      {isHost ? (
        <button type="button" onClick={again} disabled={busy} className="btn-primary w-full">
          {busy ? "Dealing" : "Rematch — new decks, same code"}
        </button>
      ) : (
        <p className="muted rounded-2xl bg-paper-tint px-4 py-4 text-center text-sm">
          Waiting for {them?.name ?? "the host"} to deal again.
        </p>
      )}

      <p className="muted text-center text-xs">
        <Link href="/games" className="underline underline-offset-4 hover:text-ink">
          Back to the shelf
        </Link>
      </p>
    </div>
  );
}
