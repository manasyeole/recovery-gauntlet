/**
 * The wire format between /api/games/* and the duel UI, plus the handful of
 * rules both sides need to agree on. Imported by server routes and client
 * components alike, so nothing in here may touch Prisma or the DOM.
 *
 * Cards are sent as ids, never as objects: the rosters are static and already
 * in the browser's bundle (lib/games/cards), so shipping the same six numbers
 * down the wire twelve times a duel would be for nothing. The one thing the
 * server does *not* send is the opponent's hand — see PublicDuelist.
 */

export type DuelStatus = "lobby" | "clash" | "resolve" | "finished";
export type DuelMode = "solo" | "room";
export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "normal", "hard"];

/** Header the browser identifies itself with. There is no session cookie. */
export const PLAYER_TOKEN_HEADER = "x-rg-player";

/* ------------------------------- tuning --------------------------------- */

/** A duel is two people. Everything downstream assumes seats 0 and 1. */
export const SEATS = 2;

export const MIN_NAME = 2;
export const MAX_NAME = 16;

/** Length of a room code. Lives here so the join box can validate offline. */
export const CODE_LENGTH = 6;

/** The avatar shelf on the join screen. Purely cosmetic. */
export const AVATARS = [
  "🦊", "🐼", "🐸", "🐙", "🦁", "🐻", "🐨", "🦄",
  "🐯", "🐵", "🦕", "🦈", "🐝", "🦉", "🐢", "🦖",
] as const;

/** What the bot is called when nobody names it. */
export const BOT_NAMES: Readonly<Record<Difficulty, string>> = {
  easy: "Rookie",
  normal: "The House",
  hard: "Grandmaster",
};

export const BOT_EMOJI = "🤖";

/* -------------------------------- state ---------------------------------- */

export interface PublicDuelist {
  id: string;
  name: string;
  emoji: string;
  seat: number;
  isHost: boolean;
  isBot: boolean;
  /** Polled recently enough to still be at the table. Always true for bots. */
  online: boolean;

  hp: number;
  /** Cards in hand — the count only. The contents are the whole game. */
  handCount: number;
  deckCount: number;
  damageDealt: number;
  roundsWon: number;

  /** Has locked a card in for the round currently on the table. */
  committed: boolean;
  /** True for the duelist reading this payload. */
  isYou: boolean;
}

/** One side of a resolved clash. Only ever sent once both cards are face-up. */
export interface ClashPlay {
  duelistId: string;
  seat: number;
  /** Roster-local id — resolve with findCard(gameSlug, cardId). */
  cardId: string;
  /** Index into the game's six stat labels. */
  stat: number;
  attack: number;
  defense: number;
  affinity: -1 | 0 | 1;
  dealt: number;
  taken: number;
  healed: number;
  hpAfter: number;
  notes: string[];
  /** Nobody committed in time, so the engine picked for them. */
  timedOut: boolean;
}

export interface Reveal {
  round: number;
  /** Roster-local event id, or null on a round with no event. */
  eventId: string | null;
  /** Exactly two, ordered by seat. */
  plays: ClashPlay[];
  /** Duelist id, or null if both put on identical damage. */
  roundWinner: string | null;
}

/** What you, and only you, can see about your own side. */
export interface Viewer {
  id: string;
  seat: number;
  isHost: boolean;
  /** Roster-local card ids. Yours alone. */
  hand: string[];
  /** What you locked in for this round, or null if you haven't. */
  committed: { cardId: string; stat: number } | null;
}

/** One line of history, kept short — the last few rounds, for the sidebar. */
export interface LogLine {
  round: number;
  /** Damage each seat put on, indexed by seat. */
  dealt: [number, number];
  /** Health each seat was left on, indexed by seat. */
  hp: [number, number];
  eventId: string | null;
}

export interface DuelState {
  code: string;
  gameSlug: string;
  mode: DuelMode;
  status: DuelStatus;

  /** 0 while in the lobby. */
  round: number;
  maxRounds: number;
  turnSeconds: number;
  startHp: number;

  /** Milliseconds left in the current phase, measured on the server clock. */
  msLeft: number;
  /** The event for the round on the table, if any. */
  eventId: string | null;

  duelists: PublicDuelist[];
  viewer: Viewer | null;
  reveal: Reveal | null;
  log: LogLine[];

  /** Seat that won, -1 for a draw, null while the duel is still going. */
  winnerSeat: number | null;
}

/* ----------------------------- validation ------------------------------- */

const CONTROL_CHARS = new RegExp("[\u0000-\u001f\u007f]", "g");

/** Trim, collapse whitespace, strip control characters. Empty means invalid. */
export function cleanName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

export function isValidName(name: string): boolean {
  return name.length >= MIN_NAME && name.length <= MAX_NAME;
}

export function cleanEmoji(raw: unknown): string {
  const list = AVATARS as readonly string[];
  return typeof raw === "string" && list.includes(raw) ? raw : list[0];
}

/** Normalises whatever the visitor typed into the join box. */
export function cleanCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
}

export function cleanDifficulty(raw: unknown): Difficulty {
  return DIFFICULTIES.find((d) => d === raw) ?? "normal";
}

/* ------------------------------ re-exports ------------------------------- */

// The combat maths lives in ./rules so it can be read on its own, but every
// consumer of the protocol wants it too. Re-exported rather than made into a
// second import everyone has to remember.
export * from "./rules";
