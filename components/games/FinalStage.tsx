"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfetti } from "@/components/Confetti";
import type { Game } from "@/lib/games/catalog";
import { rematch } from "@/lib/games/client";
import type { RoomState } from "@/lib/games/protocol";
import Scoreboard from "./Scoreboard";

/**
 * The final table. A rematch keeps the code and the people and draws new
 * questions, because the one thing nobody wants after a close game is to
 * read out a new six-character code.
 */
export default function FinalStage({
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
  const [error, setError] = useState<string | null>(null);
  const burst = useConfetti();

  const winner = state.players[0];
  const iWon = winner?.isYou ?? false;

  // Only the winner's own screen gets paper thrown at it.
  useEffect(() => {
    if (iWon) burst("big");
  }, [iWon, burst]);

  async function again() {
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await rematch(code);
      onState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up a rematch.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card rounded-chunk p-6 text-center sm:p-8">
        <span aria-hidden className="block text-5xl">
          {winner?.emoji ?? game.emoji}
        </span>
        <h1 className="mt-4 text-balance font-display text-2xl font-bold sm:text-3xl">
          {winner ? `${winner.name} takes it` : "Nobody scored"}
        </h1>
        <p className="muted mt-2 text-sm">
          {winner
            ? `${winner.score} points over ${state.totalRounds} ${game.name} questions.`
            : "Which is its own kind of achievement."}
        </p>
      </section>

      <section className="card rounded-chunk p-5 sm:p-6">
        <Scoreboard players={state.players} accent={game.accent} showMedals />
      </section>

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      {state.viewer?.isHost ? (
        <button type="button" onClick={again} disabled={busy} className="btn-primary w-full">
          {busy ? "Shuffling" : "Rematch, new questions"}
        </button>
      ) : (
        <p className="muted rounded-2xl bg-paper-tint px-4 py-4 text-center text-sm">
          The host can start a rematch in this same room.
        </p>
      )}

      <div className="flex justify-center gap-2">
        <Link href="/games" className="btn-quiet">
          Back to the shelf
        </Link>
      </div>
    </div>
  );
}
