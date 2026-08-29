/**
 * The games shelf.
 *
 * Every entry is a *theme* over one shared engine: a room-code quiz where
 * everyone answers the same timed question and the fast correct answer wins.
 * Adding a game is this file plus a question bank in ./questions/<slug>.ts —
 * no route, component or table changes.
 *
 * Colours live here rather than in tailwind.config.ts because they are data
 * (one row per game), not design tokens. They are all pale enough to sit on
 * the --paper background without fighting the clay accent.
 */

export interface Game {
  slug: string;
  name: string;
  emoji: string;
  /** One line on the card. */
  tagline: string;
  /** Two lines on the game's own page. */
  blurb: string;
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
    tagline: "Twenty-two yards of trivia.",
    blurb:
      "World Cups, run chases and the one over everyone still talks about. Test-match patience not required.",
    tint: "#eef4ec",
    accent: "#7fa676",
    ink: "#3d5c37",
  },
  {
    slug: "football",
    name: "Football",
    emoji: "⚽",
    tagline: "Ninety minutes, twelve questions.",
    blurb:
      "Clubs, cups and the goals that got argued about for forty years. Offside is not a valid answer.",
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
      "Finishers, feuds and WrestleMania. The scoring is real even if nothing else is.",
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
      "The Leaf Village, the Akatsuki, and a decade of people explaining their backstory mid-fight.",
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
      "The Straw Hats, the Grand Line and the treasure at the end of it. No spoilers past the obvious ones.",
    tint: "#e9f2f2",
    accent: "#6aa3a3",
    ink: "#2f5c5c",
  },
  {
    slug: "pokemon",
    name: "Pokémon",
    emoji: "⚡",
    tagline: "Gotta answer them all.",
    blurb:
      "Types, evolutions and 151 originals. Yes, Normal really does nothing to Ghost.",
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
      "Formula 1, Le Mans and the Indy 500. Pit stops are faster than your fastest answer.",
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
