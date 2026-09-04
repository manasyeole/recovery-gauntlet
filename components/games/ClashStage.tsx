"use client";

import { useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { findCard, type Card } from "@/lib/games/cards";
import { playCard } from "@/lib/games/client";
import type { DuelState } from "@/lib/games/protocol";
import DuelHeader, { EventBanner } from "./DuelHeader";
import PlayingCard, { CardBack } from "./PlayingCard";
import RoundTimer from "./RoundTimer";

/**
 * Choose a card, choose a stat, commit.
 *
 * Two taps and a confirm rather than one tap that fires: the stat is the
 * whole decision, and a mis-tap that spends your legend on its worst number
 * would be the most annoying thing in the game. Twenty-five seconds is plenty
 * of room for a second thought.
 *
 * Once committed the hand stays on screen, face up, greyed — so the wait has
 * something to read rather than being a spinner.
 */
export default function ClashStage({
  code,
  game,
  state,
  msLeft,
  onState,
}: {
  code: string;
  game: Game;
  state: DuelState;
  msLeft: number;
  onState: (next: DuelState) => void;
}) {
  const committed = state.viewer?.committed ?? null;

  const [pickedCard, setPickedCard] = useState<string | null>(null);
  const [pickedStat, setPickedStat] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hand: Card[] = (state.viewer?.hand ?? [])
    .map((id) => findCard(state.gameSlug, id))
    .filter((c): c is Card => Boolean(c));

  // Once you have played, the card on the table is the one to show.
  const shownId = committed?.cardId ?? pickedCard;
  const shown = shownId ? findCard(state.gameSlug, shownId) : undefined;
  const shownStat = committed ? committed.stat : pickedStat;

  const them = state.duelists.find((d) => !d.isYou);
  const ready = Boolean(pickedCard && pickedStat !== null && !busy && !committed);

  async function commit() {
    if (!ready || pickedCard === null || pickedStat === null) return;
    setBusy(true);
    setError(null);
    try {
      const { state: next } = await playCard(code, state.round, pickedCard, pickedStat);
      onState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not play that card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <DuelHeader game={game} state={state} showCommitted />

      <RoundTimer msLeft={msLeft} totalMs={state.turnSeconds * 1000} accent={game.accent} />

      <EventBanner gameSlug={state.gameSlug} eventId={state.eventId} />

      {/* --------------------------- the table --------------------------- */}
      <section className="grid grid-cols-2 gap-3" aria-label="The table">
        <div>
          <p className="muted mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest">
            {them?.name ?? "Opponent"}
          </p>
          {/* Their card is face-down and stays that way. The server does not
              send it, so there is nothing here to peek at in the network tab. */}
          <CardBack game={game} label={them?.committed ? "Card down" : "Still choosing"} />
        </div>

        <div>
          <p className="muted mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest">You</p>
          {shown ? (
            <PlayingCard
              game={game}
              card={shown}
              compact
              activeStat={shownStat}
              onPickStat={committed ? undefined : setPickedStat}
            />
          ) : (
            <CardBack game={game} label="Pick a card below" />
          )}
        </div>
      </section>

      {/* ---------------------------- the choice ------------------------- */}
      {committed ? (
        <p
          className="animate-pop-in rounded-2xl px-4 py-4 text-center text-sm"
          style={{ background: "var(--good-tint)", color: "var(--good)" }}
        >
          <strong className="font-display">
            {shown?.name} on {game.stats[committed.stat]}
          </strong>
          <span className="muted block text-xs">
            {them?.committed ? "Turning both over…" : `Waiting for ${them?.name ?? "them"}.`}
          </span>
        </p>
      ) : (
        <>
          <div>
            <p className="mb-2 text-sm font-semibold">
              {pickedCard ? "Now pick the stat to attack with" : "Your hand"}
            </p>
            <p className="muted mb-3 text-xs leading-relaxed">
              Whatever stat you choose, their card defends with the <em>same</em> one. Go where you
              think they are thin.
            </p>

            {/* A horizontal strip, because four cards do not fit across a
                phone and stacking them would bury the last one. */}
            <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
              {hand.map((card) => (
                <li key={card.id} className="w-[9.5rem] shrink-0 snap-start">
                  <PlayingCard
                    game={game}
                    card={card}
                    compact
                    selected={pickedCard === card.id}
                    activeStat={pickedCard === card.id ? pickedStat : null}
                    onSelect={() => {
                      setPickedCard(card.id);
                      setPickedStat(null);
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {pickedCard && (
            <div className="animate-pop-in">
              <p className="mb-2 text-sm font-semibold">Attack with</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {game.stats.map((label, i) => {
                  const value = shown?.stats[i] ?? 0;
                  const on = pickedStat === i;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPickedStat(i)}
                      aria-pressed={on}
                      className={`tap flex items-center justify-between gap-2 rounded-2xl border
                        px-3 py-2.5 text-left transition active:scale-[0.98]
                        ${on ? "" : "hover:border-clay-300"}`}
                      style={{
                        borderColor: on ? game.accent : "var(--line)",
                        background: on ? game.tint : "var(--card)",
                      }}
                    >
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-base font-bold tabular-nums" style={{ color: game.ink }}>
                        {value}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="animate-nudge rounded-2xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
              {error}
            </p>
          )}

          <button type="button" onClick={commit} disabled={!ready} className="btn-primary w-full">
            {busy
              ? "Playing"
              : pickedStat !== null && shown
                ? `${shown.name} — ${game.stats[pickedStat]} ${shown.stats[pickedStat]}`
                : "Pick a card and a stat"}
          </button>
        </>
      )}
    </div>
  );
}
