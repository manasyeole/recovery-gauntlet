"use client";

import { useState } from "react";
import type { Game } from "@/lib/games/catalog";
import { findCard, type Card } from "@/lib/games/cards";
import { playCard } from "@/lib/games/client";
import type { DuelState } from "@/lib/games/protocol";
import DuelHeader, { EventBanner } from "./DuelHeader";
import Hand from "./Hand";
import PlayingCard, { CardBack } from "./PlayingCard";
import RoundTimer from "./RoundTimer";

/**
 * Pick a card out of the fan, pick the stat to swing with, commit.
 *
 * Two taps and a confirm rather than one tap that fires: the stat is the whole
 * decision, and a mis-tap that spends your legend on its worst number would be
 * the most annoying thing in the game.
 *
 * Once committed the card stays on the table face-up on your side and the hand
 * stays underneath, greyed — so the wait has something to read rather than
 * being a spinner.
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

      {/* ------------------------------ the table -------------------------- */}
      {/* A minimum rather than a fixed height: the two slots stretch to match
          each other, so turning a face-down back into a full card does not
          make the table jump — but a card taller than the reservation grows
          the row instead of being clipped by the frame's overflow. */}
      <section
        className="card-stage grid min-h-[20rem] grid-cols-2 items-stretch gap-3"
        aria-label="The table"
      >
        <div className="flex flex-col">
          <p className="muted mb-1.5 truncate text-[0.65rem] font-bold uppercase tracking-widest">
            {them?.name ?? "Opponent"}
          </p>
          {/* Their card stays face-down. The server does not send it, so there
              is nothing to peek at in the network tab either. */}
          <div className="flex-1">
            <CardBack
              game={game}
              waiting={!them?.committed}
              label={them?.committed ? "Card down" : "Choosing"}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <p className="muted mb-1.5 text-[0.65rem] font-bold uppercase tracking-widest">You</p>
          <div className="flex-1">
            {shown ? (
              <PlayingCard
                game={game}
                card={shown}
                compact
                selected
                activeStat={shownStat}
                className={committed ? "flip-in" : ""}
              />
            ) : (
              <CardBack game={game} waiting label="Pick a card" />
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------ the choice ------------------------- */}
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
          {pickedCard && (
            <div className="animate-pop-in">
              <p className="mb-1 text-sm font-semibold">Attack with</p>
              <p className="muted mb-2.5 text-xs leading-relaxed">
                Their card defends with the <em>same</em> stat. Go where you think they are thin.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {game.stats.map((label, i) => {
                  const value = shown?.stats[i] ?? 0;
                  const on = pickedStat === i;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPickedStat(i)}
                      aria-pressed={on}
                      className="tap flex flex-col items-center justify-center gap-0.5 rounded-2xl
                        border px-2 py-2 text-center transition active:scale-[0.97]"
                      style={{
                        borderColor: on ? game.accent : "var(--line)",
                        background: on ? game.tint : "var(--card)",
                        boxShadow: on ? `0 0 0 3px ${game.tint}` : undefined,
                      }}
                    >
                      <span
                        className="text-lg font-bold leading-none tabular-nums"
                        style={{ color: on ? game.ink : "var(--ink)" }}
                      >
                        {value}
                      </span>
                      <span className="muted text-[0.6rem] font-semibold uppercase tracking-wide">
                        {game.statsShort[i]}
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
                ? `Play ${shown.name} — ${game.stats[pickedStat]} ${shown.stats[pickedStat]}`
                : pickedCard
                  ? "Now pick a stat"
                  : "Pick a card from your hand"}
          </button>
        </>
      )}

      {/* ------------------------------- the hand -------------------------- */}
      <section aria-label="Your hand">
        <Hand
          game={game}
          cards={hand}
          selectedId={committed?.cardId ?? pickedCard}
          disabled={Boolean(committed)}
          onSelect={(id) => {
            setPickedCard(id);
            setPickedStat(null);
          }}
        />
      </section>
    </div>
  );
}
