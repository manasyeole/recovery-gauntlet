"use client";

import type { PublicPlayer } from "@/lib/games/protocol";

/**
 * The standings. Used three ways — as a live sidebar, as the between-rounds
 * summary, and as the final table — so it takes the ornaments as props rather
 * than growing three near-identical copies.
 */
export default function Scoreboard({
  players,
  accent,
  gained,
  showMedals,
  compact,
}: {
  players: PublicPlayer[];
  accent: string;
  /** playerId to points won in the round just revealed. */
  gained?: Record<string, number>;
  showMedals?: boolean;
  compact?: boolean;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <ol className="space-y-1.5">
      {players.map((p, i) => (
        <li
          key={p.id}
          className={`flex items-center gap-3 rounded-2xl border px-3 transition ${
            compact ? "py-2" : "py-2.5"
          }`}
          style={{
            borderColor: p.isYou ? accent : "var(--line)",
            background: p.isYou ? "var(--paper-tint)" : "var(--card)",
          }}
        >
          <span
            className="w-6 shrink-0 text-center text-sm font-bold tabular-nums"
            style={{ color: "var(--ink-soft)" }}
          >
            {showMedals && i < 3 ? medals[i] : i + 1}
          </span>

          <span aria-hidden className={`shrink-0 ${p.online ? "" : "opacity-35"} text-xl`}>
            {p.emoji}
          </span>

          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {p.name}
            {p.isHost && <span className="muted ml-1.5 text-xs font-normal">host</span>}
            {!p.online && <span className="muted ml-1.5 text-xs font-normal">away</span>}
          </span>

          {p.streak >= 3 && (
            <span
              className="shrink-0 text-xs font-bold tabular-nums"
              title={`${p.streak} in a row`}
              aria-label={`${p.streak} correct in a row`}
            >
              🔥{p.streak}
            </span>
          )}

          {gained && gained[p.id] > 0 && (
            <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: accent }}>
              +{gained[p.id]}
            </span>
          )}

          <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
