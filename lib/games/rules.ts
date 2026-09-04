/**
 * The whole fight, as arithmetic.
 *
 * `resolveClash` is pure and total: same inputs, same outputs, no clock, no
 * randomness, no Prisma, no DOM. The server calls it to write the result of a
 * round and the browser calls it for nothing at all — but it *could*, and
 * that is the point: there is exactly one description of what a clash does,
 * so the number on the screen can never disagree with the number in the
 * database.
 *
 * Shared by "use client" components and route handlers alike. Nothing in here
 * may import either side's toys.
 */

import { affinityEdge, type Game } from "./catalog";
import type { Card, GameEvent } from "./cards";

/* ------------------------------- tuning ---------------------------------- */

/** Starting health. Twelve rounds of typical damage is roughly two of these. */
export const START_HP = 36;

/** Stats are 1–10; the gap between two of them is multiplied by this. */
export const DAMAGE_SCALE = 2;

/** Even a hopeless attack scratches. Nothing is ever a total whiff. */
export const CHIP_DAMAGE = 1;

/**
 * The ceiling on one swing, before a riposte is added to it.
 *
 * The modifiers multiply rather than add — a `surge` card, into the stat its
 * opponent is worst at, with the affinity, on a `damage_up` round, gets there
 * four times over and would otherwise hit for around 50. Which is more than
 * anybody starts with.
 *
 * A third of starting health is chosen so the invariant is easy to state and
 * easy to keep: no duel can be over in fewer than three clashes, however
 * badly one of them goes. Perfect reads still hit the ceiling — they just
 * don't end the game on their own.
 */
export const MAX_HIT = Math.round(START_HP / 3);

/** Cards in hand. Small enough to read on a phone in one go. */
export const HAND_SIZE = 4;

/** Cards dealt to each duelist. Reshuffled from the discard if it runs out. */
export const DECK_SIZE = 10;

/** Beating the opponent's archetype, and being beaten by it. */
export const AFFINITY_STRONG = 1.5;
export const AFFINITY_WEAK = 0.65;

/** An event turns over on every third round. */
export const EVENT_EVERY = 3;

/** How long the clash result stays up before the next hand. */
export const RESOLVE_MS = 7_000;

/** A duelist who has not polled within this is shown as away. */
export const AWAY_MS = 25_000;

export const TURN_SECONDS_CHOICES = [15, 20, 25, 40] as const;
export const MAX_ROUNDS_CHOICES = [6, 9, 12, 16] as const;

/** Finisher abilities wake up below this fraction of starting health. */
export const DESPERATE_AT = 1 / 3;

/* ------------------------------- shapes ---------------------------------- */

/** One duelist's committed play, plus the state they walk into the round with. */
export interface Side {
  card: Card;
  /** Index into the game's six stats. */
  stat: number;
  hp: number;
  startHp: number;
}

export interface ClashInput {
  game: Game;
  a: Side;
  b: Side;
  /** The event turned over for this round, if any. */
  event: GameEvent | null;
}

/** What one side did and what it cost them. */
export interface SideResult {
  /** The stat it attacked with, after `surge`. */
  attack: number;
  /** The opposing card's same stat, after `defense_up` and the attacker's `pierce`. */
  defense: number;
  /** -1 beaten by the archetype, 0 neutral, +1 beats it. */
  affinity: -1 | 0 | 1;
  /** Damage this side put on the other, before their riposte. */
  dealt: number;
  /** Damage this side took: the opponent's `dealt`, plus its own riposte back. */
  taken: number;
  /** Rally + drain, before damage is applied. */
  healed: number;
  hpAfter: number;
  /** One short line per thing that fired, for the resolve screen. */
  notes: string[];
}

export interface ClashResult {
  a: SideResult;
  b: SideResult;
  /** "a", "b", or null when both put on the same damage. */
  roundWinner: "a" | "b" | null;
}

/* ------------------------------ the clash -------------------------------- */

const pct = (n: number) => n / 100;

/**
 * Resolves one round.
 *
 * Both attacks are computed from the *same* pre-clash snapshot and applied at
 * the end, so the round is genuinely simultaneous — knocking someone out does
 * not stop their swing landing. Two cards can take each other out at once,
 * and that is a draw rather than a win for whoever was listed first.
 *
 * Order of operations, which is the whole design:
 *
 *   1. rally + heal_both              (health before anything is thrown)
 *   2. surge                          → attack value
 *   3. defense_up, then pierce        → defense value
 *   4. (attack − defense) × scale     → raw, floored at CHIP_DAMAGE
 *   5. affinity                       → ×1.5 / ×0.65
 *   6. the round's event              → ×1.5 / ×0.6
 *   7. finisher                       → the attacker's own health matters
 *   8. guard                          → the defender's card cuts it
 *   9. MAX_HIT                       → the ceiling on one swing
 *  10. riposte, drain, then apply
 */
export function resolveClash({ game, a, b, event }: ClashInput): ClashResult {
  const quiet = event?.kind === "abilities_off";
  const flat = event?.kind === "no_affinity";
  const defenseBonus = event?.kind === "defense_up" ? event.value : 0;

  const notesA: string[] = [];
  const notesB: string[] = [];
  if (event) {
    notesA.push(event.name);
    notesB.push(event.name);
  }

  /* 1 — health going into the round --------------------------------------- */

  const heal = (side: Side, notes: string[]) => {
    let healed = 0;
    if (!quiet && side.card.ability.kind === "rally") {
      healed += side.card.ability.value;
      notes.push(`${side.card.ability.name} +${side.card.ability.value}`);
    }
    if (event?.kind === "heal_both") healed += event.value;
    return healed;
  };

  const healA = heal(a, notesA);
  const healB = heal(b, notesB);
  const hpA = Math.min(a.startHp, a.hp + healA);
  const hpB = Math.min(b.startHp, b.hp + healB);

  /* 2–8 — one side's swing ------------------------------------------------ */

  const swing = (
    atkSide: Side,
    defSide: Side,
    atkHp: number,
    notes: string[]
  ): { attack: number; defense: number; affinity: -1 | 0 | 1; dealt: number } => {
    const atkCard = atkSide.card;
    const defCard = defSide.card;
    const ability = atkCard.ability;

    // 2 — what it swings with.
    let attack = atkCard.stats[atkSide.stat] ?? 0;
    if (!quiet && ability.kind === "surge") {
      attack += ability.value;
      notes.push(`${ability.name} +${ability.value}`);
    }

    // 3 — what stands in the way. The defender resists with the *same* stat
    // on their own card, which is the whole read: you are guessing what they
    // are strong in, not just how strong they are.
    let defense = (defCard.stats[atkSide.stat] ?? 0) + defenseBonus;
    if (!quiet && ability.kind === "pierce") {
      const ignored = defense * pct(ability.value);
      defense -= ignored;
      notes.push(`${ability.name} −${ability.value}% defence`);
    }

    // 4 — the gap, floored so nothing is wasted entirely.
    let dmg = Math.max(CHIP_DAMAGE, attack - defense) * DAMAGE_SCALE;

    // 5 — the triangle.
    const affinity = flat ? 0 : affinityEdge(game, atkCard.affinity, defCard.affinity);
    if (affinity === 1) {
      dmg *= AFFINITY_STRONG;
      notes.push(`${atkCard.affinity} beats ${defCard.affinity}`);
    } else if (affinity === -1) {
      dmg *= AFFINITY_WEAK;
      notes.push(`${atkCard.affinity} loses to ${defCard.affinity}`);
    }

    // 6 — the round's weather.
    if (event?.kind === "damage_up") dmg *= 1 + pct(event.value);
    if (event?.kind === "damage_down") dmg *= 1 - pct(event.value);

    // 7 — cornered animals.
    if (!quiet && ability.kind === "finisher" && atkHp <= atkSide.startHp * DESPERATE_AT) {
      dmg *= 1 + pct(ability.value);
      notes.push(`${ability.name} +${ability.value}%`);
    }

    // 8 — and what the other card does about it.
    const defAbility = defCard.ability;
    if (!quiet && defAbility.kind === "guard") {
      dmg *= 1 - pct(defAbility.value);
    }

    // 9 — and the ceiling. See MAX_HIT: the modifiers above multiply, so
    // without this a perfect read is a knockout rather than a good round.
    const uncapped = Math.max(1, Math.round(dmg));
    const dealt = Math.min(MAX_HIT, uncapped);
    if (dealt < uncapped) notes.push(`capped at ${MAX_HIT}`);

    return {
      attack: round1(attack),
      defense: round1(Math.max(0, defense)),
      affinity,
      dealt,
    };
  };

  const swingA = swing(a, b, hpA, notesA);
  const swingB = swing(b, a, hpB, notesB);

  /* 10 — reflections, drains, and the bill --------------------------------- */

  // Riposte is computed off the base damage on both sides at once, so it can
  // never bounce back and forth.
  const riposte = (side: Side, incoming: number, notes: string[]): number => {
    if (quiet || side.card.ability.kind !== "riposte" || incoming <= 0) return 0;
    const back = Math.round(incoming * pct(side.card.ability.value));
    if (back > 0) notes.push(`${side.card.ability.name} ${back} back`);
    return back;
  };

  const backFromA = riposte(a, swingB.dealt, notesA);
  const backFromB = riposte(b, swingA.dealt, notesB);

  const drain = (side: Side, dealt: number, notes: string[]): number => {
    if (quiet || side.card.ability.kind !== "drain" || dealt <= 0) return 0;
    const healedBy = Math.round(dealt * pct(side.card.ability.value));
    if (healedBy > 0) notes.push(`${side.card.ability.name} +${healedBy}`);
    return healedBy;
  };

  const drainA = drain(a, swingA.dealt, notesA);
  const drainB = drain(b, swingB.dealt, notesB);

  const takenA = swingB.dealt + backFromB;
  const takenB = swingA.dealt + backFromA;

  const hpAfterA = clamp(hpA + drainA - takenA, 0, a.startHp);
  const hpAfterB = clamp(hpB + drainB - takenB, 0, b.startHp);

  const totalA = swingA.dealt + backFromA;
  const totalB = swingB.dealt + backFromB;

  return {
    a: {
      attack: swingA.attack,
      defense: swingA.defense,
      affinity: swingA.affinity,
      dealt: totalA,
      taken: takenA,
      healed: healA + drainA,
      hpAfter: hpAfterA,
      notes: notesA,
    },
    b: {
      attack: swingB.attack,
      defense: swingB.defense,
      affinity: swingB.affinity,
      dealt: totalB,
      taken: takenB,
      healed: healB + drainB,
      hpAfter: hpAfterB,
      notes: notesB,
    },
    roundWinner: totalA === totalB ? null : totalA > totalB ? "a" : "b",
  };
}

/* ------------------------------- endings --------------------------------- */

export interface Standing {
  hp: number;
  damageDealt: number;
}

/**
 * Who has won, or null if the duel is still going.
 *
 * A duel ends when someone is on the floor or the rounds run out; on rounds,
 * it is health first and total damage dealt as the tie-break, so a cautious
 * duel still has an answer at the end of it.
 */
export function verdict(
  a: Standing,
  b: Standing,
  round: number,
  maxRounds: number
): "a" | "b" | "draw" | null {
  const down = a.hp <= 0 || b.hp <= 0;
  if (!down && round < maxRounds) return null;

  if (a.hp !== b.hp) return a.hp > b.hp ? "a" : "b";
  if (a.damageDealt !== b.damageDealt) return a.damageDealt > b.damageDealt ? "a" : "b";
  return "draw";
}

/** Which round numbers turn an event over. Rounds are 1-based. */
export function isEventRound(round: number): boolean {
  return round > 0 && round % EVENT_EVERY === 0;
}

/* ------------------------------- helpers --------------------------------- */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** One decimal place, so a pierced defence reads 6.5 rather than 6.4999. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
