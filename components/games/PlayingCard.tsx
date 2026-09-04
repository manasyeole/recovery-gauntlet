"use client";

import type { Game } from "@/lib/games/catalog";
import { affinityOf } from "@/lib/games/catalog";
import type { Card, Rarity } from "@/lib/games/cards";

/**
 * One card, face up.
 *
 * The layout is the same three bands at every size, because the whole point
 * of a card is that you learn where to look once: who it is, what its six
 * numbers are, and what it does that nothing else does. `compact` drops the
 * ability text and shrinks the type — it does not move anything.
 *
 * Stat rows become buttons when `onPickStat` is passed. That is the entire
 * interaction of the game: choosing which row to attack with.
 */

/** Rarity as a colour. Warm enough to sit on the paper background. */
const RARITY: Record<Rarity, { label: string; ink: string; wash: string; edge: string }> = {
  common: { label: "Common", ink: "#7b716a", wash: "#f4efe9", edge: "#e3d9d0" },
  rare: { label: "Rare", ink: "#3f6d92", wash: "#eaf2f8", edge: "#b8d3e6" },
  epic: { label: "Epic", ink: "#6b4f96", wash: "#f1ecf9", edge: "#cbbce6" },
  legend: { label: "Legend", ink: "#98701a", wash: "#fbf3dd", edge: "#e6cd8a" },
};

export interface PlayingCardProps {
  game: Game;
  card: Card;
  /** Half-size type, no ability blurb. For the hand strip and the deck grid. */
  compact?: boolean;
  /** Highlights one row — the stat chosen, or the one that was attacked with. */
  activeStat?: number | null;
  /** Makes every row a button. */
  onPickStat?: (stat: number) => void;
  /** Draws the card as chosen, with the game's accent as its edge. */
  selected?: boolean;
  /** Tapping anywhere picks the card itself. */
  onSelect?: () => void;
  /** Greys the whole thing out — a card already played this duel. */
  dimmed?: boolean;
}

export default function PlayingCard({
  game,
  card,
  compact = false,
  activeStat = null,
  onPickStat,
  selected = false,
  onSelect,
  dimmed = false,
}: PlayingCardProps) {
  const rarity = RARITY[card.rarity];
  const affinity = affinityOf(game, card.affinity);
  const labels = compact ? game.statsShort : game.stats;

  const body = (
    <>
      {/* ------------------------------ portrait ------------------------- */}
      <div
        className="relative overflow-hidden rounded-t-[1.1rem] px-3 pb-2 pt-3"
        style={{ background: game.tint }}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest"
            style={{ background: rarity.wash, color: rarity.ink }}
          >
            {rarity.label}
          </span>
          {affinity && (
            <span
              className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[0.6rem]
                font-bold uppercase tracking-wide"
              style={{ color: game.ink }}
            >
              <span aria-hidden>{affinity.emoji}</span>
              {affinity.name}
            </span>
          )}
        </div>

        <span
          aria-hidden
          className={`mx-auto block text-center leading-none ${compact ? "py-2 text-4xl" : "py-4 text-6xl"}`}
        >
          {card.emoji}
        </span>

        <h3
          className={`font-display font-bold leading-tight ${compact ? "text-sm" : "text-lg"}`}
          style={{ color: game.ink }}
        >
          {card.name}
        </h3>
        <p
          className={`leading-snug ${compact ? "text-[0.62rem]" : "text-xs"}`}
          style={{ color: "var(--ink-soft)" }}
        >
          {card.title}
        </p>
      </div>

      {/* -------------------------------- stats -------------------------- */}
      <ul className={`space-y-px border-y border-line ${compact ? "px-2 py-1.5" : "px-3 py-2"}`}>
        {card.stats.map((value, i) => {
          const isActive = activeStat === i;
          const row = (
            <>
              <span
                className={`shrink-0 font-semibold uppercase tracking-wide
                  ${compact ? "w-9 text-[0.55rem]" : "w-[4.5rem] text-[0.68rem]"}`}
                style={{ color: isActive ? game.ink : "var(--ink-soft)" }}
              >
                {labels[i]}
              </span>

              {/* The bar is what makes a card readable at a glance — a shape
                  you recognise before you have read a single number. */}
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${value * 10}%`,
                    background: isActive ? game.accent : `${game.accent}88`,
                  }}
                />
              </span>

              <span
                className={`shrink-0 text-right font-bold tabular-nums
                  ${compact ? "w-4 text-[0.65rem]" : "w-5 text-sm"}`}
                style={{ color: isActive ? game.ink : "var(--ink)" }}
              >
                {value}
              </span>
            </>
          );

          return (
            <li key={labels[i]}>
              {onPickStat ? (
                <button
                  type="button"
                  onClick={() => onPickStat(i)}
                  aria-pressed={isActive}
                  className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left
                    transition active:scale-[0.99] ${compact ? "" : "min-h-[34px]"}`}
                  style={isActive ? { background: game.tint } : undefined}
                >
                  {row}
                </button>
              ) : (
                <span
                  className="flex items-center gap-2 px-1.5 py-1"
                  style={isActive ? { background: game.tint, borderRadius: "0.5rem" } : undefined}
                >
                  {row}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* ------------------------------- ability ------------------------- */}
      <div className={compact ? "px-2.5 py-1.5" : "px-3.5 py-2.5"}>
        <p
          className={`font-display font-bold leading-tight ${compact ? "text-[0.68rem]" : "text-sm"}`}
          style={{ color: game.ink }}
        >
          <span aria-hidden className="mr-1">
            ★
          </span>
          {card.ability.name}
        </p>
        {!compact && (
          <p className="muted mt-0.5 text-[0.72rem] leading-snug">{card.ability.text}</p>
        )}
      </div>
    </>
  );

  const frame = `relative flex flex-col overflow-hidden rounded-[1.2rem] border-2 bg-card
    transition ${dimmed ? "opacity-40 grayscale" : ""}`;

  const edge = selected ? game.accent : rarity.edge;
  const style = {
    borderColor: edge,
    boxShadow: selected ? `0 0 0 3px ${game.tint}, var(--shadow-lift)` : "var(--shadow-soft)",
  };

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`${frame} text-left hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0
          active:scale-[0.99]`}
        style={style}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={frame} style={style}>
      {body}
    </div>
  );
}

/**
 * The other side of a card, for an opponent who has committed but whose
 * choice is nobody's business until both are turned over.
 */
export function CardBack({ game, label }: { game: Game; label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[1.2rem] border-2 p-6 text-center"
      style={{ borderColor: `${game.accent}66`, background: game.tint }}
    >
      <span aria-hidden className="text-5xl opacity-25">
        {game.emoji}
      </span>
      {label && (
        <p className="mt-3 text-xs font-semibold" style={{ color: game.ink }}>
          {label}
        </p>
      )}
    </div>
  );
}
