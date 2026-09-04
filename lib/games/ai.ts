/**
 * The computer opponent.
 *
 * Pure: hand in, play out. No Prisma, no clock, no randomness it wasn't
 * handed — `rand` is a parameter so a difficulty can be reproduced in a test
 * rather than argued about.
 *
 * What it is allowed to know is exactly what a person sitting opposite would
 * know: its own hand, both healths, the round's event, and which cards the
 * other side has already played. It does *not* see the opponent's hand. Every
 * estimate below is built out of "which cards could they still be holding",
 * which is the same guess a human is making.
 */

import { affinityEdge, type Game } from "./catalog";
import { cardsFor, type Card } from "./cards";
import type { GameEvent } from "./cards";
import {
  AFFINITY_STRONG,
  AFFINITY_WEAK,
  DESPERATE_AT,
  resolveClash,
} from "./rules";
import type { Difficulty } from "./protocol";

export interface BotView {
  game: Game;
  /** Roster-local ids the bot is holding. */
  hand: readonly string[];
  hp: number;
  opponentHp: number;
  startHp: number;
  /** Roster-local ids the opponent has already played. */
  opponentSeen: readonly string[];
  event: GameEvent | null;
  difficulty: Difficulty;
}

export interface BotPlay {
  cardId: string;
  stat: number;
}

/**
 * How hard the bot tries.
 *
 * `noise` is added to every candidate's score as a fraction of the spread
 * between the best and worst option, so an easy bot genuinely sometimes picks
 * the wrong stat rather than picking the right one slowly. `reads` is whether
 * it bothers to narrow the opponent down by what they have already played.
 */
const SETTINGS: Record<Difficulty, { noise: number; reads: boolean; defensive: number }> = {
  easy: { noise: 1.4, reads: false, defensive: 0 },
  normal: { noise: 0.45, reads: false, defensive: 0.35 },
  hard: { noise: 0, reads: true, defensive: 0.6 },
};

/**
 * Picks a card and a stat to attack with.
 *
 * Falls back to the first card in hand on its best stat if anything is
 * missing, so a bot can never fail to play — a stuck bot would hang the room
 * for the person opposite.
 */
export function botPlay(view: BotView, rand: () => number = Math.random): BotPlay {
  const roster = cardsFor(view.game.slug);
  const hand = view.hand
    .map((id) => roster.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));

  if (hand.length === 0) {
    return { cardId: view.hand[0] ?? roster[0]?.id ?? "", stat: 0 };
  }

  const cfg = SETTINGS[view.difficulty] ?? SETTINGS.normal;

  // What the opponent could still be holding. On `hard` that is the roster
  // minus what they have shown; below that the bot doesn't keep track, which
  // is most of what makes it beatable.
  const seen = new Set(cfg.reads ? view.opponentSeen : []);
  const plausible = roster.filter((c) => !seen.has(c.id));
  const pool = plausible.length > 0 ? plausible : roster;

  /* --------------------------- the estimates --------------------------- */

  // What a typical remaining card would defend each stat with.
  const avgDefence: number[] = [];
  for (let s = 0; s < 6; s++) {
    avgDefence[s] = mean(pool.map((c) => c.stats[s] ?? 0));
  }

  // What the triangle is worth against an unknown card, given how many of
  // each archetype they could still be holding.
  const affinityValue = (mine: string): number => {
    let total = 0;
    for (const c of pool) {
      const edge = affinityEdge(view.game, mine, c.affinity);
      total += edge === 1 ? AFFINITY_STRONG : edge === -1 ? AFFINITY_WEAK : 1;
    }
    return pool.length > 0 ? total / pool.length : 1;
  };

  // How exposed a card leaves you: an attack lands on whichever stat *they*
  // choose, so what matters defensively is the card's weakest stats, not its
  // average. A lopsided legend is a liability on the round it gets read.
  const exposure = (c: Card): number => {
    const sorted = [...c.stats].sort((x, y) => x - y);
    return mean(sorted.slice(0, 3));
  };

  const desperate = view.hp <= view.startHp * DESPERATE_AT;
  const closing = view.opponentHp <= view.startHp * DESPERATE_AT;

  /* ---------------------------- the scoring ---------------------------- */

  interface Candidate extends BotPlay {
    score: number;
  }
  const candidates: Candidate[] = [];

  for (const card of hand) {
    const affinity = affinityValue(card.affinity);
    const guard = exposure(card);

    for (let stat = 0; stat < 6; stat++) {
      const gap = (card.stats[stat] ?? 0) - (avgDefence[stat] ?? 0);
      let score = gap * affinity;

      // The card you play is also the card that has to take the hit.
      score += (guard - 5) * cfg.defensive;

      // Signature moves the bot understands well enough to reach for.
      const ability = card.ability;
      if (view.event?.kind !== "abilities_off") {
        if (ability.kind === "surge") score += ability.value * 0.6;
        if (ability.kind === "pierce") score += (avgDefence[stat] ?? 0) * (ability.value / 100);
        if (ability.kind === "guard") score += ability.value / 40;
        if (ability.kind === "rally" && desperate) score += ability.value / 3;
        if (ability.kind === "drain" && desperate) score += ability.value / 30;
        if (ability.kind === "finisher" && desperate) score += ability.value / 20;
      }

      // Late on, stop optimising the average and go for the kill: score the
      // move against the actual best card they could be holding instead.
      if (closing && cfg.reads) {
        score += worstCaseDamage(view, card, stat, pool) / 4;
      }

      candidates.push({ cardId: card.id, stat, score });
    }
  }

  /* ----------------------------- the choice ---------------------------- */

  const best = Math.max(...candidates.map((c) => c.score));
  const worst = Math.min(...candidates.map((c) => c.score));
  const spread = Math.max(1, best - worst);

  let choice = candidates[0];
  let bestScore = -Infinity;
  for (const c of candidates) {
    const jitter = cfg.noise === 0 ? 0 : (rand() - 0.5) * spread * cfg.noise;
    const total = c.score + jitter;
    if (total > bestScore) {
      bestScore = total;
      choice = c;
    }
  }

  return { cardId: choice.cardId, stat: choice.stat };
}

/**
 * What this play would actually do against the *worst* card they could turn
 * over — used only when the bot is closing out, where the difference between
 * a good average and a killing blow is the whole game.
 */
function worstCaseDamage(
  view: BotView,
  card: Card,
  stat: number,
  pool: readonly Card[]
): number {
  let least = Infinity;
  for (const theirs of pool) {
    const { a } = resolveClash({
      game: view.game,
      a: { card, stat, hp: view.hp, startHp: view.startHp },
      b: { card: theirs, stat, hp: view.opponentHp, startHp: view.startHp },
      event: view.event,
    });
    least = Math.min(least, a.dealt);
  }
  return Number.isFinite(least) ? least : 0;
}

function mean(ns: readonly number[]): number {
  return ns.length === 0 ? 0 : ns.reduce((sum, n) => sum + n, 0) / ns.length;
}
