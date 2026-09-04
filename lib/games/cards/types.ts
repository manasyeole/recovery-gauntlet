/**
 * One fighter card.
 *
 * `id` has to be stable forever: a duel stores the ids it dealt at creation
 * time and the Card table keys its lifetime record off them, so renaming an
 * id orphans both. Append new cards, never renumber old ones.
 */

/**
 * The six numbers, in the order of its game's `stats` labels. Always 1–10 —
 * the whole scale is chosen so the card face reads like the back of a
 * sticker album rather than a spreadsheet.
 */
export type Stats = readonly [number, number, number, number, number, number];

/**
 * Rarity is a stat *budget*, not a power level you can free-hand: every card
 * of a rarity sums to the same total, so a legend is a lopsided common rather
 * than a strictly better one. scripts/check-cards.mts enforces it.
 */
export type Rarity = "common" | "rare" | "epic" | "legend";

export const RARITY_BUDGET: Readonly<Record<Rarity, number>> = {
  common: 33,
  rare: 38,
  epic: 43,
  legend: 48,
};

/** How many of each a ten-card deck is dealt. See dealDeck in ../duel/deal.ts. */
export const RARITY_QUOTA: Readonly<Record<Rarity, number>> = {
  common: 4,
  rare: 3,
  epic: 2,
  legend: 1,
};

/** Every roster holds exactly this many of each rarity. */
export const ROSTER_QUOTA: Readonly<Record<Rarity, number>> = {
  common: 5,
  rare: 4,
  epic: 3,
  legend: 2,
};

export const RARITIES: readonly Rarity[] = ["common", "rare", "epic", "legend"];

/* ------------------------------ abilities -------------------------------- */

/**
 * Signature moves. Seven kinds, shared by all seven games — the engine
 * resolves the kind and the roster supplies the name, so a Rasengan and a
 * Tombstone Piledriver are the same three lines of arithmetic wearing
 * different hats.
 *
 * All of them are resolved inside one pure function (resolveClash in
 * ../duel/rules.ts). Nothing here may need state beyond the current round.
 */
export type AbilityKind =
  /** Your attack ignores `value`% of the defender's matching stat. */
  | "pierce"
  /** Damage coming at you is cut by `value`%. */
  | "guard"
  /** You heal `value`% of the damage you deal. */
  | "drain"
  /** +`value` to whichever stat you attack with, before anything else. */
  | "surge"
  /** `value`% of the damage you take is sent straight back. */
  | "riposte"
  /** Below a third of your starting HP, your damage is +`value`%. */
  | "finisher"
  /** Heal `value` flat the moment the card is turned over. */
  | "rally";

export interface Ability {
  kind: AbilityKind;
  /** Percent for every kind except `surge` and `rally`, which are flat. */
  value: number;
  /** The move's own name, in the game's voice. */
  name: string;
  /** One line, present tense, on the card face. */
  text: string;
}

export interface Card {
  /** Unique within its roster. Prefixed with the game slug when stored. */
  id: string;
  name: string;
  /** The line under the name — a nickname, an era, a Pokédex number. */
  title: string;
  /** One of its game's three affinity keys. */
  affinity: string;
  rarity: Rarity;
  stats: Stats;
  ability: Ability;
  /** The subject of the card face, when there is no artwork. */
  emoji: string;
  /**
   * Optional artwork, as a path under /public — e.g. "/cards/wwe/undertaker.png".
   *
   * Left unset everywhere on purpose: ninety-eight licensed photographs is a
   * rights problem this repo has no answer to. Every card face is drawn from
   * its own stats instead (see components/games/CardArt.tsx), and dropping a
   * file in here swaps the middle of that frame without touching anything
   * else — so real art can arrive one card at a time.
   */
  image?: string;
}

/* -------------------------------- events --------------------------------- */

/**
 * A special event turns over between clashes and hits both sides equally, so
 * it never decides a duel on its own — it just makes one round strange.
 */
export type EventKind =
  /** All damage this round ×(1 + value/100). */
  | "damage_up"
  /** All damage this round ×(1 - value/100). */
  | "damage_down"
  /** +`value` to every defending stat. Low rolls become whiffs. */
  | "defense_up"
  /** Both duelists heal `value` before the clash. */
  | "heal_both"
  /** The affinity triangle is off this round. */
  | "no_affinity"
  /** Signature moves don't fire this round. */
  | "abilities_off";

export interface GameEvent {
  id: string;
  name: string;
  /** One line, shown on the banner as the round opens. */
  text: string;
  kind: EventKind;
  value: number;
  emoji: string;
}

/** A whole game's cards plus the events that can interrupt them. */
export interface Roster {
  cards: readonly Card[];
  events: readonly GameEvent[];
}

/* ------------------------------- helpers --------------------------------- */

export function statTotal(stats: Stats): number {
  return stats.reduce((sum, n) => sum + n, 0);
}

/** Index of the highest stat. Ties go to the earlier one. */
export function bestStat(stats: Stats): number {
  let best = 0;
  for (let i = 1; i < stats.length; i++) if (stats[i] > stats[best]) best = i;
  return best;
}
