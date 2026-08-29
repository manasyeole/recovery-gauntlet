"use client";

import { useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { startGame } from "@/lib/games/client";
import { MAX_PLAYERS, type RoomState } from "@/lib/games/protocol";
import RoomCode from "./RoomCode";

/**
 * The waiting room. Its whole job is to make the code impossible to miss and
 * the Start button obvious to exactly one person.
 */
export default function Lobby({
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
  const isHost = state.viewer?.isHost ?? false;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await startGame(code);
      onState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card rounded-chunk p-6 sm:p-8">
        <RoomCode code={code} accent={game.ink} />
      </section>

      <section className="card rounded-chunk p-5 sm:p-7">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold">In the room</h2>
          <span className="muted text-xs font-semibold tabular-nums">
            {state.players.length} / {MAX_PLAYERS}
          </span>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {state.players.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold
                ${p.online ? "" : "opacity-45"}`}
              style={{
                borderColor: p.isYou ? game.accent : "var(--line)",
                background: p.isYou ? game.tint : "var(--card)",
              }}
            >
              <span aria-hidden className="text-lg">
                {p.emoji}
              </span>
              {p.name}
              {p.isHost && <span className="muted text-xs font-normal">host</span>}
            </li>
          ))}
        </ul>

        <p className="muted mt-5 text-sm leading-relaxed">
          {state.totalRounds} questions, {state.roundSeconds} seconds each. Answer fast — the clock
          is worth as much as being right.
        </p>
      </section>

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      {isHost ? (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="btn-primary w-full"
        >
          {busy ? "Starting" : `Start the ${state.totalRounds} questions`}
        </button>
      ) : (
        <p className="muted rounded-2xl bg-paper-tint px-4 py-4 text-center text-sm">
          Waiting for {state.players.find((p) => p.isHost)?.name ?? "the host"} to start.
        </p>
      )}
    </div>
  );
}
