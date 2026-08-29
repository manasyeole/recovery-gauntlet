"use client";

import { PLAYER_TOKEN_HEADER, type RoomState } from "./protocol";

/**
 * The browser half of the games section.
 *
 * Identity is a token in localStorage, one per room. That is deliberately all
 * there is: nobody signs up, nothing is recoverable on another device, and
 * clearing site data simply means you join again as a new player.
 */

const tokenKey = (code: string) => `rg.game.${code}.token`;
const KEY_LAST_NAME = "rg.game.name";
const KEY_LAST_EMOJI = "rg.game.emoji";

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode — the run still works, it just won't survive a refresh */
  }
}

export function playerToken(code: string): string | null {
  return readLocal(tokenKey(code));
}

export function rememberPlayer(code: string, token: string): void {
  writeLocal(tokenKey(code), token);
}

export function forgetPlayer(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(tokenKey(code));
  } catch {
    /* ignore */
  }
}

/** Prefills the next join form so regulars type their name once a night. */
export function lastName(): string {
  return readLocal(KEY_LAST_NAME) ?? "";
}

export function lastEmoji(): string {
  return readLocal(KEY_LAST_EMOJI) ?? "";
}

export function rememberIdentity(name: string, emoji: string): void {
  writeLocal(KEY_LAST_NAME, name);
  writeLocal(KEY_LAST_EMOJI, emoji);
}

/* -------------------------------- fetch --------------------------------- */

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Turns the API's { error, message } envelope into something throwable. */
async function call<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: init.method ?? "GET",
    cache: "no-store",
    signal: init.signal,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.token ? { [PLAYER_TOKEN_HEADER]: init.token } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* a 500 with an HTML body still needs a sensible message */
  }

  if (!res.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "request_failed",
      typeof data.message === "string" ? data.message : defaultMessage(res.status),
      res.status
    );
  }
  return data as T;
}

function defaultMessage(status: number): string {
  if (status === 404) return "That room has closed or never existed.";
  if (status === 503) return "The games server is not reachable right now.";
  return "Something went wrong. Try that again.";
}

/* ------------------------------ endpoints ------------------------------- */

export interface CreateRoomInput {
  gameSlug: string;
  name: string;
  emoji: string;
  totalRounds: number;
  roundSeconds: number;
}

export async function createRoom(
  input: CreateRoomInput
): Promise<{ code: string; token: string; state: RoomState }> {
  const out = await call<{ code: string; token: string; state: RoomState }>("/api/games/rooms", {
    method: "POST",
    body: input,
  });
  rememberPlayer(out.code, out.token);
  rememberIdentity(input.name, input.emoji);
  return out;
}

export async function joinRoom(
  code: string,
  input: { name: string; emoji: string }
): Promise<{ token: string; state: RoomState }> {
  const out = await call<{ token: string; state: RoomState }>(
    `/api/games/rooms/${encodeURIComponent(code)}/join`,
    { method: "POST", body: input, token: playerToken(code) }
  );
  rememberPlayer(code, out.token);
  rememberIdentity(input.name, input.emoji);
  return out;
}

export function fetchState(code: string, signal?: AbortSignal): Promise<{ state: RoomState }> {
  return call<{ state: RoomState }>(`/api/games/rooms/${encodeURIComponent(code)}`, {
    token: playerToken(code),
    signal,
  });
}

function post(code: string, action: string, body: Record<string, unknown> = {}) {
  return call<{ state: RoomState }>(`/api/games/rooms/${encodeURIComponent(code)}/${action}`, {
    method: "POST",
    body,
    token: playerToken(code),
  });
}

export const startGame = (code: string) => post(code, "start");
export const skipPhase = (code: string) => post(code, "next");
export const rematch = (code: string) => post(code, "rematch");
export const sendAnswer = (code: string, round: number, choice: number) =>
  post(code, "answer", { round, choice });
