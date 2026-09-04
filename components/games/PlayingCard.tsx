"use client";

import type { Game } from "@/lib/games/catalog";
import { affinityOf } from "@/lib/games/catalog";
import type { Card, Rarity } from "@/lib/games/cards";
import CardArt from "./CardArt";

/**
 * One card, face up.
 *
 * The layout is the same four bands at every size, because the whole point of
 * a card is that you learn where to look once: the picture, who it is, its six
 * numbers, and the one thing it does that nothing else does. `compact` shrinks
 * the type and drops the ability blurb — it never moves anything.
 *
 * Stat rows become buttons when `onPickStat` is passed. That is the entire
 * interaction of the game: choosing which row to attack with.
 */

/** Rarity as a colour and a treatment. Warm enough for the paper background. */
const RARITY: Record<
  Rarity,
  { label: string; ink: string; wash: string; edge: string; foil: boolean }
> = {
  common: { label: "Common", ink: "#7b716a", wash: "#f4efe9", edge: "#ded3c9", foil: false },
  rare: { label: "Rare", ink: "#3f6d92", wash: "#eaf2f8", edge: "#a8c9e0", foil: false },
  epic: { label: "Epic", ink: "#6b4f96", wash: "#f1ecf9", edge: "#c3b1e2", foil: true },
  legend: { label: "Legend", ink: "#98701a", wash: "#fbf3dd", edge: "#dcbf6e", foil: true },
};

export interface PlayingCardProps {
  game: Game;
  card: Card;
  /** Smaller type, no ability blurb. For the hand and the deck grid. */
  compact?: boolean;
  /** Highlights one row — the stat chosen, or the one that was attacked with. */
  activeStat?: number | null;
  /** Makes every row a button. */
  onPickStat?: (stat: number) => void;
  /** Draws the card as chosen, with the game's accent as its edge. */
  selected?: boolean;
  /** Tapping anywhere picks the card itself. */
  onSelect?: () => void;
  /** Greys the whole thing out. */
  dimmed?: boolean;
  /** Extra classes on the frame — the clash animations ride in on this. */
  className?: string;
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
  className = "",
}: PlayingCardProps) {
  const rarity = RARITY[card.rarity];
  const affinity = affinityOf(game, card.affinity);
  const labels = compact ? game.statsShort : game.stats;

  const body = (
    <>
      {/* ------------------------------ the art -------------------------- */}
      <div className={`relative ${compact ? "h-[5.6rem]" : "h-[7.5rem]"}`}>
        <CardArt game={game} card={card} compact={compact} />

        {/* Rarity, top left. Affinity, top right. Both float over the art. */}
        <span
          className="absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold
            uppercase tracking-widest backdrop-blur-[2px]"
          style={{ background: `${rarity.wash}e0`, color: rarity.ink }}
        >
          {rarity.label}
        </span>

        {affinity && (
          <span
            className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/80 px-1.5
              py-0.5 text-[0.55rem] font-bold uppercase tracking-wide backdrop-blur-[2px]"
            style={{ color: game.ink }}
          >
            <span aria-hidden>{affinity.emoji}</span>
            {!compact && affinity.name}
          </span>
        )}
      </div>

      {/* ----------------------------- the name -------------------------- */}
      <div
        className={`border-b border-line ${compact ? "px-2.5 pb-1.5 pt-1" : "px-3.5 pb-2 pt-1.5"}`}
        style={{ background: `${game.tint}80` }}
      >
        <h3
          className={`truncate font-display font-bold leading-tight ${compact ? "text-[0.8rem]" : "text-lg"}`}
          style={{ color: game.ink }}
        >
          {card.name}
        </h3>
        <p
          className={`truncate leading-snug ${compact ? "text-[0.58rem]" : "text-xs"}`}
          style={{ color: "var(--ink-soft)" }}
        >
          {card.title}
        </p>
      </div>

      {/* ---------------------------- the numbers ------------------------ */}
      <ul className={`space-y-px ${compact ? "px-1.5 py-1" : "px-3 py-2"}`}>
        {card.stats.map((value, i) => {
          const isActive = activeStat === i;
          const row = (
            <>
              <span
                className={`shrink-0 font-semibold uppercase tracking-wide
                  ${compact ? "w-8 text-[0.52rem]" : "w-[4.5rem] text-[0.68rem]"}`}
                style={{ color: isActive ? game.ink : "var(--ink-soft)" }}
              >
                {labels[i]}
              </span>

              {/* The bar is what makes a card readable at a glance — a shape
                  you recognise before you have read a single number. */}
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${value * 10}%`,
                    background: isActive ? game.accent : `${game.accent}88`,
                  }}
                />
              </span>

              <span
                className={`shrink-0 text-right font-bold tabular-nums
                  ${compact ? "w-3.5 text-[0.62rem]" : "w-5 text-sm"}`}
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
                  aria-label={`Attack with ${game.stats[i]}, ${value}`}
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

      {/* ---------------------------- the move --------------------------- */}
      <div
        className={`mt-auto border-t border-line ${compact ? "px-2.5 py-1.5" : "px-3.5 py-2.5"}`}
        style={{ background: `${rarity.wash}70` }}
      >
        <p
          className={`truncate font-display font-bold leading-tight ${compact ? "text-[0.62rem]" : "text-sm"}`}
          style={{ color: rarity.ink }}
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

  const frame = [
    "relative flex h-full flex-col overflow-hidden rounded-[1.1rem] border-2 bg-card",
    rarity.foil ? "foil" : "",
    card.rarity === "legend" ? "foil-legend" : "",
    dimmed ? "opacity-40 grayscale" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    borderColor: selected ? game.accent : rarity.edge,
    boxShadow: selected ? `0 0 0 3px ${game.tint}, var(--shadow-lift)` : "var(--shadow-soft)",
  };

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`${frame} card-lift text-left`}
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
 * The other side of a card: an opponent who has committed, or one still
 * thinking. Drawn as a real card back — the same size and edge as the face,
 * so turning it over doesn't make the table jump.
 */
export function CardBack({
  game,
  label,
  waiting = false,
  className = "",
}: {
  game: Game;
  label?: string;
  /** Softly pulses, for a card that hasn't been chosen yet. */
  waiting?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full flex-col items-center justify-center overflow-hidden
        rounded-[1.1rem] border-2 p-4 text-center ${className}`}
      style={{
        borderColor: `${game.accent}77`,
        background: `repeating-linear-gradient(135deg, ${game.tint} 0 10px, #ffffff 10px 20px)`,
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {/* A crest, so the back reads as this deck's back and not a grey box. */}
      <span
        aria-hidden
        className={`grid h-16 w-16 place-items-center rounded-full text-3xl ${
          waiting ? "animate-pulse" : ""
        }`}
        style={{ background: "#ffffffcc", border: `2px solid ${game.accent}55` }}
      >
        {game.emoji}
      </span>

      {label && (
        <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-widest" style={{ color: game.ink }}>
          {label}
        </p>
      )}
    </div>
  );
}
