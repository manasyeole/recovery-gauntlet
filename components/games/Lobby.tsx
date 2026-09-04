"use client";

import { useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { startDuel } from "@/lib/games/client";
import { SEATS, type DuelState } from "@/lib/games/protocol";
import Hand from "./Hand";
import RoomCode from "./RoomCode";
import { findCard, type Card } from "@/lib/games/cards";

/**
 * The chair opposite is either filled or it isn't, and that is the only thing
 * this screen has to communicate. In a solo duel it is filled the moment the
 * duel exists, so the code panel gets out of the way entirely.
 */
export default function Lobby({
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = state.viewer?.isHost ?? false;
  const solo = state.mode === "solo";
  const full = state.duelists.length >= SEATS;

  const hand: Card[] = (state.viewer?.hand ?? [])
    .map((id) => findCard(state.gameSlug, id))
    .filter((c): c is Card => Boolean(c));

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await startDuel(code);
      onState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {!solo && (
        <section className="card rounded-chunk p-6 sm:p-8">
          <RoomCode code={code} accent={game.ink} />
        </section>
      )}

      <section className="card rounded-chunk p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">
          {solo ? "Against the computer" : "At the table"}
        </h2>

        <ul className="mt-4 space-y-2">
          {[0, 1].map((seat) => {
            const d = state.duelists.find((x) => x.seat === seat);
            return (
              <li
                key={seat}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: d?.isYou ? game.accent : "var(--line)",
                  background: d?.isYou ? game.tint : "var(--card)",
                  opacity: d ? 1 : 0.55,
                }}
              >
                <span aria-hidden className="text-xl">
                  {d?.emoji ?? "🪑"}
                </span>
                <span className="font-semibold">{d?.name ?? "Empty chair"}</span>
                {d?.isYou && <span className="muted text-xs">you</span>}
                {d?.isBot && <span className="muted text-xs">cpu · {state.mode}</span>}
                {!d && <span className="muted text-xs">waiting…</span>}
              </li>
            );
          })}
        </ul>

        <p className="muted mt-4 text-sm leading-relaxed">
          {state.startHp} health each, {state.maxRounds} rounds, {state.turnSeconds} seconds a turn.
          Both cards turn over at once, so you can both land.
        </p>
      </section>

      {/* Your opening hand, dealt into the fan, so the wait is spent learning
          your own cards rather than watching an empty chair. */}
      {hand.length > 0 && (
        <section aria-labelledby="hand-heading">
          <h2 id="hand-heading" className="mb-1 text-sm font-semibold">
            Your opening hand
          </h2>
          <p className="muted mb-2 text-xs leading-relaxed">
            Ten cards each, dealt to the same rarity quota — so the two decks are different and
            worth exactly the same.
          </p>
          <Hand game={game} cards={hand} selectedId={null} disabled onSelect={() => {}} />
        </section>
      )}

      {error && (
        <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      {isHost ? (
        <button
          type="button"
          onClick={start}
          disabled={busy || !full}
          className="btn-primary w-full"
        >
          {busy ? "Dealing" : full ? "Start the duel" : "Waiting for an opponent"}
        </button>
      ) : (
        <p className="muted rounded-2xl bg-paper-tint px-4 py-4 text-center text-sm">
          Waiting for {state.duelists.find((d) => d.isHost)?.name ?? "the host"} to start.
        </p>
      )}
    </div>
  );
}
