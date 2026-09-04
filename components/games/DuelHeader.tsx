"use client";

import type { Game } from "@/lib/games/catalog";
import { findEvent } from "@/lib/games/cards";
import type { DuelState, PublicDuelist } from "@/lib/games/protocol";

/**
 * Both duelists and both health bars, always in the same place.
 *
 * You above, them below — never sorted by score, never reordered mid-duel.
 * The one thing a fighting game has to get right is that you can find your
 * own health bar without looking for it.
 */
export default function DuelHeader({
  game,
  state,
  showCommitted = false,
}: {
  game: Game;
  state: DuelState;
  /** During a clash, mark who has already put a card down. */
  showCommitted?: boolean;
}) {
  const you = state.duelists.find((d) => d.isYou);
  const them = state.duelists.find((d) => !d.isYou);

  return (
    <section className="card rounded-chunk p-4 sm:p-5" aria-label="Health">
      <div className="space-y-3">
        {them && (
          <Bar game={game} duelist={them} startHp={state.startHp} showCommitted={showCommitted} />
        )}

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="muted text-[0.65rem] font-bold uppercase tracking-widest">
            {state.status === "lobby"
              ? `${state.maxRounds} rounds`
              : `Round ${state.round} of ${state.maxRounds}`}
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {you && (
          <Bar game={game} duelist={you} startHp={state.startHp} showCommitted={showCommitted} />
        )}
      </div>
    </section>
  );
}

function Bar({
  game,
  duelist,
  startHp,
  showCommitted,
}: {
  game: Game;
  duelist: PublicDuelist;
  startHp: number;
  showCommitted: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (duelist.hp / Math.max(1, startHp)) * 100));
  // Below a third is where finisher abilities wake up, so it is worth saying
  // out loud rather than leaving people to notice the bar is short.
  const desperate = duelist.hp <= startHp / 3;

  return (
    <div className={duelist.online ? "" : "opacity-50"}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
          <span aria-hidden className="text-base">
            {duelist.emoji}
          </span>
          <span className="truncate">{duelist.name}</span>
          {duelist.isYou && (
            <span className="muted shrink-0 text-[0.6rem] font-bold uppercase tracking-widest">
              you
            </span>
          )}
          {duelist.isBot && (
            <span className="muted shrink-0 text-[0.6rem] font-bold uppercase tracking-widest">
              cpu
            </span>
          )}
        </p>

        <p className="shrink-0 text-sm font-bold tabular-nums">
          <span style={{ color: desperate ? "var(--bad)" : "var(--ink)" }}>{duelist.hp}</span>
          <span className="muted font-normal"> / {startHp}</span>
        </p>
      </div>

      <div
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={startHp}
        aria-valuenow={duelist.hp}
        aria-label={`${duelist.name}'s health`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: desperate ? "var(--bad)" : game.accent }}
        />
      </div>

      <div className="muted mt-1 flex items-center gap-2 text-[0.65rem]">
        <span className="tabular-nums">{duelist.handCount} in hand</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">{duelist.deckCount} in deck</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">{duelist.roundsWon} rounds</span>
        {showCommitted && (
          <span
            className="ml-auto font-bold uppercase tracking-widest"
            style={{ color: duelist.committed ? "var(--good)" : "var(--ink-soft)" }}
          >
            {duelist.committed ? "ready" : "choosing"}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The round's special event, when there is one. Deliberately loud: it changes
 * the arithmetic for both sides, and a rule nobody noticed is worse than no
 * rule at all.
 */
export function EventBanner({ gameSlug, eventId }: { gameSlug: string; eventId: string | null }) {
  const event = eventId ? findEvent(gameSlug, eventId) : undefined;
  if (!event) return null;

  return (
    <p
      className="animate-pop-in flex items-start gap-3 rounded-2xl px-4 py-3 text-sm"
      style={{ background: "var(--tint-butter)" }}
      role="status"
    >
      <span aria-hidden className="text-xl leading-none">
        {event.emoji}
      </span>
      <span>
        <span className="font-display font-bold">{event.name}</span>
        <span className="muted"> — {event.text}</span>
      </span>
    </p>
  );
}
