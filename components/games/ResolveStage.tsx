"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/components/Confetti";
import type { Game } from "@/lib/games/catalog";
import { findCard } from "@/lib/games/cards";
import type { ClashPlay, DuelState } from "@/lib/games/protocol";
import DuelHeader, { EventBanner } from "./DuelHeader";
import PlayingCard from "./PlayingCard";

/**
 * Both cards turned over, thrown at each other, and then — the part that
 * actually matters — an account of why the numbers came out that way.
 *
 * A card game where damage simply appears teaches nobody anything, and the
 * whole skill here is learning to read what someone is likely to be holding.
 * So the choreography earns its keep by being paced: the cards turn over, they
 * collide, the damage lands, and only *then* does the arithmetic appear
 * underneath. You watch the fight, then you read the maths.
 *
 * Every phase ends in the state React has already rendered, so under
 * prefers-reduced-motion the whole sequence collapses to its final frame with
 * nothing missing.
 */

type Phase = "flip" | "lunge" | "impact" | "settle";

/** When each phase begins, in milliseconds. Comfortably inside RESOLVE_MS. */
const AT: Record<Exclude<Phase, "flip">, number> = {
  lunge: 620,
  impact: 1020,
  settle: 2100,
};

export default function ResolveStage({ game, state }: { game: Game; state: DuelState }) {
  const [phase, setPhase] = useState<Phase>("flip");

  const reveal = state.reveal;
  const round = reveal?.round;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase("settle");
      return;
    }
    setPhase("flip");
    const timers = [
      setTimeout(() => setPhase("lunge"), AT.lunge),
      setTimeout(() => setPhase("impact"), AT.impact),
      setTimeout(() => setPhase("settle"), AT.settle),
    ];
    return () => timers.forEach(clearTimeout);
    // Re-run per round, so a rematch or a fast host doesn't leave it settled.
  }, [round]);

  if (!reveal) return null;

  const mine = reveal.plays.find((p) => p.duelistId === state.viewer?.id);
  const theirs = reveal.plays.find((p) => p.duelistId !== state.viewer?.id);
  const you = state.duelists.find((d) => d.isYou);
  const them = state.duelists.find((d) => !d.isYou);

  const headline =
    reveal.roundWinner === null
      ? "Even round"
      : reveal.roundWinner === you?.id
        ? "You took the round"
        : `${them?.name ?? "They"} took the round`;

  const hit = phase === "impact" || phase === "settle";

  return (
    <div className="space-y-4">
      <DuelHeader game={game} state={state} />

      <EventBanner gameSlug={state.gameSlug} eventId={reveal.eventId} />

      {/* ------------------------------ the clash -------------------------- */}
      <section className="card-stage relative" aria-label="The clash">
        <div className="grid min-h-[20rem] grid-cols-2 items-stretch gap-3">
          <Side
            game={game}
            state={state}
            play={theirs}
            label={them?.name ?? "Opponent"}
            side="left"
            phase={phase}
            won={reveal.roundWinner === them?.id}
          />
          <Side
            game={game}
            state={state}
            play={mine}
            label="You"
            side="right"
            phase={phase}
            won={reveal.roundWinner === you?.id}
          />
        </div>

        {/* The moment of contact, right where the two cards meet. */}
        {phase === "impact" && (
          <span
            aria-hidden
            className="impact-flash pointer-events-none absolute left-1/2 top-1/3 h-24 w-24
              -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, #fff 0%, ${game.accent}cc 45%, transparent 70%)`,
            }}
          />
        )}
      </section>

      <p
        className={`text-center font-display text-lg font-bold transition-opacity duration-500 ${
          hit ? "opacity-100" : "opacity-0"
        }`}
        role="status"
      >
        {headline}
      </p>

      {/* ------------------------------ the maths -------------------------- */}
      <section
        className={`grid grid-cols-2 gap-3 transition-all duration-500 ${
          phase === "settle" ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        aria-label="How the round was scored"
      >
        <Sum game={game} play={theirs} />
        <Sum game={game} play={mine} />
      </section>
    </div>
  );
}

/** One duelist's card, doing whatever this phase asks of it. */
function Side({
  game,
  state,
  play,
  label,
  side,
  phase,
  won,
}: {
  game: Game;
  state: DuelState;
  play: ClashPlay | undefined;
  label: string;
  side: "left" | "right";
  phase: Phase;
  won: boolean;
}) {
  if (!play) return <div />;
  const card = findCard(state.gameSlug, play.cardId);
  if (!card) return <div />;

  const classes = [
    phase === "flip" ? "flip-in" : "",
    phase === "lunge" ? (side === "left" ? "lunge-left" : "lunge-right") : "",
    // Shaken only if it actually took something.
    phase === "impact" && play.taken > 0 ? "took-a-hit" : "",
    phase === "settle" && won ? "round-won" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showDamage = phase === "impact" || phase === "settle";

  return (
    <div className="relative flex flex-col">
      <p className="muted mb-1.5 truncate text-[0.65rem] font-bold uppercase tracking-widest">
        {label}
      </p>

      <div className="card-3d flex-1">
        <PlayingCard game={game} card={card} compact activeStat={play.stat} className={classes} />
      </div>

      {/* What this card's owner lost, thrown up off the card. */}
      {showDamage && play.taken > 0 && (
        <span
          key={`${play.duelistId}-${play.taken}`}
          aria-hidden
          className="damage-pop pointer-events-none absolute left-1/2 top-16 -translate-x-1/2
            font-display text-4xl font-bold"
          style={{ color: "var(--bad)", textShadow: "0 2px 10px rgb(255 255 255 / 0.9)" }}
        >
          −{play.taken}
        </span>
      )}

      {showDamage && play.healed > 0 && (
        <span
          aria-hidden
          className="damage-pop pointer-events-none absolute left-1/2 top-24 -translate-x-1/2
            font-display text-2xl font-bold"
          style={{
            color: "var(--good)",
            textShadow: "0 2px 10px rgb(255 255 255 / 0.9)",
            animationDelay: "260ms",
          }}
        >
          +{play.healed}
        </span>
      )}
    </div>
  );
}

/** The arithmetic, once the fight has finished happening. */
function Sum({ game, play }: { game: Game; play: ClashPlay | undefined }) {
  if (!play) return <div />;

  return (
    <div className="card space-y-1.5 rounded-2xl p-3 text-xs">
      <p className="flex items-baseline justify-between gap-2">
        <span className="muted truncate">{game.stats[play.stat]}</span>
        <span className="shrink-0 font-bold tabular-nums">
          {play.attack} <span className="muted font-normal">vs</span> {play.defense}
        </span>
      </p>

      <p className="flex items-baseline justify-between gap-2">
        <span className="muted">Dealt</span>
        <span className="font-display text-lg font-bold" style={{ color: "var(--bad)" }}>
          {play.dealt}
        </span>
      </p>

      {play.timedOut && <p className="muted italic">Out of time — played automatically.</p>}

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
  );
}
