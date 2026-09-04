/**
 * The decks shelf.
 *
 * Every entry is a *theme* over one shared duel engine: two fighters are put
 * down face-down, each attacks with one of its six stats, and both cards are
 * turned over at once. Adding a game is this file plus a roster in
 * ./cards/<slug>.ts — no route, component or table changes.
 *
 * Two things here are load-bearing rather than decorative:
 *
 *   `stats`      the six attributes, in the order they are stored on a card
 *                and drawn on its face. Renaming one is cosmetic; reordering
 *                one silently repoints every stat array in that roster, so
 *                don't.
 *
 *   `affinities` exactly three archetypes forming a cycle: index 0 beats 1,
 *                1 beats 2, 2 beats 0. The engine reads nothing but that
 *                order, so the triangle is the same shape in all seven games
 *                and only the words change.
 *
 * Colours live here rather than in tailwind.config.ts because they are data
 * (one row per game), not design tokens. They are all pale enough to sit on
 * the --paper background without fighting the clay accent.
 */

/** The six attribute labels of one game, in storage order. */
export type StatLabels = readonly [string, string, string, string, string, string];

export interface Affinity {
  /** Stored on cards. Lowercase, stable forever. */
  key: string;
  /** Drawn on the card face. */
  name: string;
  emoji: string;
}

export interface Game {
  slug: string;
  name: string;
  emoji: string;
  /** One line on the shelf card. */
  tagline: string;
  /** Two lines on the deck's own page. */
  blurb: string;

  /** The six stats, in storage order. See the note above. */
  stats: StatLabels;
  /** Four-character versions for the cramped in-hand card face. */
  statsShort: StatLabels;
  /** Exactly three, in beats-order: 0 ▸ 1 ▸ 2 ▸ 0. */
  affinities: readonly [Affinity, Affinity, Affinity];
  /** What this game calls the thing you swing. Flavour on the clash screen. */
  clashVerb: string;

  /** Card wash. */
  tint: string;
  /** Border + accent line. */
  accent: string;
  /** Text/foreground strong enough to read on `tint`. */
  ink: string;
}

export const GAMES: readonly Game[] = [
  {
    slug: "cricket",
    name: "Cricket",
    emoji: "🏏",
    tagline: "Twenty-two yards, two cards.",
    blurb:
      "Willow against pace against spin. Pick the stat you back yourself on and hope they didn't cover it.",
    stats: ["Batting", "Bowling", "Fielding", "Power", "Composure", "Experience"],
    statsShort: ["BAT", "BOWL", "FLD", "PWR", "COMP", "EXP"],
    affinities: [
      { key: "willow", name: "Willow", emoji: "🏏" },
      { key: "pace", name: "Pace", emoji: "🔥" },
      { key: "spin", name: "Spin", emoji: "🌀" },
    ],
    clashVerb: "plays",
    tint: "#eef4ec",
    accent: "#7fa676",
    ink: "#3d5c37",
  },
  {
    slug: "football",
    name: "Football",
    emoji: "⚽",
    tagline: "Eleven a side, one card each.",
    blurb:
      "The front line runs at the middle, the middle runs at the back, and the back kicks the front line into the stands.",
    stats: ["Pace", "Shooting", "Passing", "Dribbling", "Defending", "Physical"],
    statsShort: ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"],
    affinities: [
      { key: "attack", name: "Attack", emoji: "⚡" },
      { key: "midfield", name: "Midfield", emoji: "🎯" },
      { key: "defence", name: "Defence", emoji: "🛡️" },
    ],
    clashVerb: "brings on",
    tint: "#eaf1f7",
    accent: "#6f9dc4",
    ink: "#2f5a80",
  },
  {
    slug: "wwe",
    name: "WWE",
    emoji: "🤼",
    tagline: "Ask your opponent politely to lie down.",
    blurb:
      "Powerhouses out-muscle technicians, technicians ground high-flyers, and high-flyers go over the top of powerhouses.",
    stats: ["Power", "Technique", "Agility", "Strike", "Submission", "Grapple"],
    statsShort: ["PWR", "TECH", "AGI", "STR", "SUB", "GRAP"],
    affinities: [
      { key: "powerhouse", name: "Powerhouse", emoji: "💪" },
      { key: "technician", name: "Technician", emoji: "🔧" },
      { key: "highflyer", name: "High-Flyer", emoji: "🕊️" },
    ],
    clashVerb: "sends out",
    tint: "#fbeceb",
    accent: "#d97b6c",
    ink: "#8f3b2d",
  },
  {
    slug: "naruto",
    name: "Naruto",
    emoji: "🍥",
    tagline: "Hand signs optional.",
    blurb:
      "Ninjutsu overwhelms genjutsu, genjutsu unpicks taijutsu, and taijutsu closes the gap before you finish the seals.",
    stats: ["Ninjutsu", "Taijutsu", "Genjutsu", "Chakra", "Speed", "Intellect"],
    statsShort: ["NIN", "TAI", "GEN", "CHK", "SPD", "INT"],
    affinities: [
      { key: "ninjutsu", name: "Ninjutsu", emoji: "🌀" },
      { key: "genjutsu", name: "Genjutsu", emoji: "👁️" },
      { key: "taijutsu", name: "Taijutsu", emoji: "👊" },
    ],
    clashVerb: "summons",
    tint: "#fdf1e6",
    accent: "#e3a05c",
    ink: "#94551f",
  },
  {
    slug: "one-piece",
    name: "One Piece",
    emoji: "🏴‍☠️",
    tagline: "A very long way to a hat.",
    blurb:
      "Haki lands on anything a Devil Fruit hides behind. A Devil Fruit eats a blade. A blade is quicker than willpower.",
    stats: ["Haki", "Devil Fruit", "Strength", "Speed", "Endurance", "Cunning"],
    statsShort: ["HAKI", "FRUT", "STR", "SPD", "END", "CUN"],
    affinities: [
      { key: "haki", name: "Haki", emoji: "🌊" },
      { key: "fruit", name: "Devil Fruit", emoji: "🍎" },
      { key: "blade", name: "Blade", emoji: "⚔️" },
    ],
    clashVerb: "calls up",
    tint: "#e9f2f2",
    accent: "#6aa3a3",
    ink: "#2f5c5c",
  },
  {
    slug: "pokemon",
    name: "Pokémon",
    emoji: "⚡",
    tagline: "Gotta play them all.",
    blurb:
      "The oldest triangle there is. Fire burns Grass, Grass drinks Water, Water puts Fire out — and it is still worth half your damage.",
    stats: ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"],
    statsShort: ["HP", "ATK", "DEF", "SPA", "SPD", "SPE"],
    affinities: [
      { key: "fire", name: "Fire", emoji: "🔥" },
      { key: "grass", name: "Grass", emoji: "🌿" },
      { key: "water", name: "Water", emoji: "💧" },
    ],
    clashVerb: "sends out",
    tint: "#fcf5e3",
    accent: "#dcb64a",
    ink: "#8a6714",
  },
  {
    slug: "racing",
    name: "Racing",
    emoji: "🏎️",
    tagline: "Lights out and away we go.",
    blurb:
      "A qualifier starts ahead of a racer. A racer drives round a strategist. A strategist pits early and takes the qualifier's afternoon.",
    stats: ["Top Speed", "Cornering", "Braking", "Racecraft", "Consistency", "Tyre Care"],
    statsShort: ["SPD", "COR", "BRK", "RACE", "CONS", "TYRE"],
    affinities: [
      { key: "qualifier", name: "Qualifier", emoji: "⏱️" },
      { key: "racer", name: "Racer", emoji: "🏁" },
      { key: "strategist", name: "Strategist", emoji: "🧠" },
    ],
    clashVerb: "rolls out",
    tint: "#f0eef4",
    accent: "#8b84ad",
    ink: "#4a4368",
  },
] as const;

export function getGame(slug: string | undefined | null): Game | undefined {
  if (!slug) return undefined;
  return GAMES.find((g) => g.slug === slug);
}

export const GAME_SLUGS: readonly string[] = GAMES.map((g) => g.slug);

/* ------------------------------ affinity -------------------------------- */

/**
 * Where an affinity key sits in its game's cycle, or -1 if the key is not
 * one of this game's three. Callers treat -1 as "no interaction".
 */
export function affinityIndex(game: Game, key: string): number {
  return game.affinities.findIndex((a) => a.key === key);
}

export function affinityOf(game: Game, key: string): Affinity | undefined {
  return game.affinities.find((a) => a.key === key);
}

/**
 * -1, 0 or +1 for how `attacker` fares against `defender`: +1 when the
 * attacker's archetype beats the defender's, -1 when it is beaten, 0 when
 * they match or either key is unknown.
 *
 * The whole triangle is `(i + 1) % 3` — see the note on Game.affinities.
 */
export function affinityEdge(game: Game, attacker: string, defender: string): -1 | 0 | 1 {
  const a = affinityIndex(game, attacker);
  const d = affinityIndex(game, defender);
  if (a < 0 || d < 0 || a === d) return 0;
  return (a + 1) % 3 === d ? 1 : -1;
}
