/**
 * The wire format between /api/games/* and the room UI, plus the handful of
 * rules both sides need to agree on. Imported by server routes and client
 * components alike, so nothing in here may touch Prisma or the DOM.
 */

export type RoomStatus = "lobby" | "question" | "reveal" | "finished";

/** Header the browser identifies itself with. There is no session cookie. */
export const PLAYER_TOKEN_HEADER = "x-rg-player";

/* ------------------------------- tuning -------------------------------- */

/** Awarded for any correct answer, however slow. */
export const BASE_POINTS = 100;
/** Awarded on top, scaled by how much of the clock was left. */
export const SPEED_POINTS = 100;
/** Every third correct answer in a row is worth a little more. */
export const STREAK_BONUS = 25;
/** How long the answer + explanation stays up between questions. */
export const REVEAL_MS = 6_000;
/** A player who has not polled within this is shown as away. */
export const AWAY_MS = 25_000;

export const ROUND_SECONDS_CHOICES = [10, 15, 20, 30] as const;
export const TOTAL_ROUNDS_CHOICES = [5, 10, 15, 20] as const;

export const MIN_NAME = 2;
export const MAX_NAME = 16;
export const MAX_PLAYERS = 12;

/** Length of a room code. Lives here so the join box can validate offline. */
export const CODE_LENGTH = 6;

/** The avatar shelf on the join screen. Purely cosmetic. */
export const AVATARS = [
  "🦊", "🐼", "🐸", "🐙", "🦁", "🐻", "🐨", "🦄",
  "🐯", "🐵", "🦕", "🦈", "🐝", "🦉", "🐢", "🦖",
] as const;

/* ------------------------------ scoring -------------------------------- */

/**
 * Points for one answer. Correctness is worth most of it; the rest is a
 * linear speed bonus, so a confident fast answer beats a lucky slow one but
 * being first is never enough on its own.
 */
export function scoreAnswer(opts: {
  correct: boolean;
  msTaken: number;
  roundMs: number;
  /** Streak *before* this answer. */
  streak: number;
}): number {
  if (!opts.correct) return 0;
  const remaining = Math.max(0, Math.min(1, 1 - opts.msTaken / Math.max(1, opts.roundMs)));
  const speed = Math.round(SPEED_POINTS * remaining);
  const streakStep = Math.floor((opts.streak + 1) / 3);
  return BASE_POINTS + speed + streakStep * STREAK_BONUS;
}

/* ------------------------------- state --------------------------------- */

export interface PublicPlayer {
  id: string;
  name: string;
  emoji: string;
  score: number;
  streak: number;
  isHost: boolean;
  /** Polled recently enough to still be in the room. */
  online: boolean;
  /** Has locked in an answer for the round currently on screen. */
  answered: boolean;
  /** True for the player reading this payload. */
  isYou: boolean;
}

export interface LiveQuestion {
  /** 1-based. */
  round: number;
  prompt: string;
  choices: string[];
}

export interface Reveal {
  correctIndex: number;
  fact?: string;
  /** playerId to chosen index, or -1 if they ran out of clock. */
  picks: Record<string, number>;
  /** playerId to points earned this round. */
  gained: Record<string, number>;
}

export interface Viewer {
  id: string;
  name: string;
  isHost: boolean;
  /** What you picked this round, null if you haven't. */
  pick: number | null;
}

export interface RoomState {
  code: string;
  gameSlug: string;
  status: RoomStatus;
  /** 0 while in the lobby. */
  round: number;
  totalRounds: number;
  roundSeconds: number;
  /** Milliseconds left in the current phase, measured on the server clock. */
  msLeft: number;
  players: PublicPlayer[];
  viewer: Viewer | null;
  question: LiveQuestion | null;
  reveal: Reveal | null;
}

/* ----------------------------- validation ------------------------------ */

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

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
