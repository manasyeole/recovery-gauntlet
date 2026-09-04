"use client";

import type { Game } from "@/lib/games/catalog";
import { findCard } from "@/lib/games/cards";
import type { ClashPlay, DuelState } from "@/lib/games/protocol";
import DuelHeader, { EventBanner } from "./DuelHeader";
import PlayingCard from "./PlayingCard";

/**
 * Both cards face up, and — the part that matters — *why* the numbers came
 * out the way they did.
 *
 * A card game where damage appears without explanation teaches nobody
 * anything, and the whole skill here is learning to read what someone is
 * likely to be holding. So every clash shows the attack, the stat that
 * defended it, whether the triangle was involved, and which signature moves
 * fired. The notes come from the same function that did the arithmetic.
 */
export default function ResolveStage({
  game,
  state,
}: {
  game: Game;
  state: DuelState;
}) {
  const reveal = state.reveal;
  if (!reveal) return null;

  const mine = reveal.plays.find((p) => p.duelistId === state.viewer?.id);
  const theirs = reveal.plays.find((p) => p.duelistId !== state.viewer?.id);
  const you = state.duelists.find((d) => d.isYou);
  const them = state.duelists.find((d) => !d.isYou);

  const outcome =
    reveal.roundWinner === null
      ? "Even round"
      : reveal.roundWinner === you?.id
        ? "You took the round"
        : `${them?.name ?? "They"} took the round`;

  return (
    <div className="space-y-4">
      <DuelHeader game={game} state={state} />

      <EventBanner gameSlug={state.gameSlug} eventId={reveal.eventId} />

      <p className="text-center font-display text-lg font-bold">{outcome}</p>

      <section className="grid grid-cols-2 gap-3" aria-label="The clash">
        <Half game={game} state={state} play={theirs} label={them?.name ?? "Opponent"} />
        <Half game={game} state={state} play={mine} label="You" />
      </section>
    </div>
  );
}

function Half({
  game,
  state,
  play,
  label,
}: {
  game: Game;
  state: DuelState;
  play: ClashPlay | undefined;
  label: string;
}) {
  if (!play) return <div />;
  const card = findCard(state.gameSlug, play.cardId);
  if (!card) return <div />;

  return (
    <div className="animate-pop-in space-y-2">
      <p className="muted text-[0.65rem] font-bold uppercase tracking-widest">{label}</p>

      <PlayingCard game={game} card={card} compact activeStat={play.stat} />

      {/* ------------------------------ the sum -------------------------- */}
      <div className="card space-y-1.5 rounded-2xl p-3 text-xs">
        <p className="flex items-baseline justify-between gap-2">
          <span className="muted">{game.stats[play.stat]}</span>
          <span className="font-bold tabular-nums">
            {play.attack} <span className="muted font-normal">vs</span> {play.defense}
          </span>
        </p>

        <p className="flex items-baseline justify-between gap-2">
          <span className="muted">Damage dealt</span>
          <span className="font-display text-lg font-bold" style={{ color: "var(--bad)" }}>
            {play.dealt}
          </span>
        </p>

        {play.healed > 0 && (
          <p className="flex items-baseline justify-between gap-2">
            <span className="muted">Recovered</span>
            <span className="font-bold tabular-nums" style={{ color: "var(--good)" }}>
              +{play.healed}
            </span>
          </p>
        )}

        {play.timedOut && (
          <p className="muted italic">Out of time — played automatically.</p>
        )}

        {play.notes.length > 0 && (
          <ul className="flex flex-wrap gap-1 pt-1">
            {play.notes.map((note) => (
              <li
                key={note}
                className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
                style={{ background: game.tint, color: game.ink }}
              >
                {note}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
