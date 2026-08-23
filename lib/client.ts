"use client";

import { TOTAL_STEPS } from "./steps";

/**
 * Client-side session + answer persistence.
 *
 * Every answer is written to localStorage FIRST and then POSTed. That means a
 * flaky connection (or a missing DATABASE_URL) never loses the visitor's
 * progress or breaks the certificate screen — the network write is a best-
 * effort mirror, and failed writes are retried on the next step.
 */

const KEY_SESSION = "rg.sessionId";
const KEY_NAME = "rg.name";
const KEY_ANSWERS = "rg.answers";
const KEY_QUEUE = "rg.queue";
const KEY_STEP = "rg.step";

export interface StoredAnswer {
  stepNumber: number;
  question: string;
  answer: string;
}

type AnswerMap = Record<string, StoredAnswer>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the in-memory run still works */
  }
}

/* ------------------------------ session id ------------------------------ */

function localId(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return `local-${c.randomUUID()}`;
  return `local-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getSessionId(): string | null {
  return read<string | null>(KEY_SESSION, null);
}

/**
 * Returns the session id, creating a server-side Session row on first call.
 * Falls back to a local-only id if the API is unreachable, so the gauntlet
 * is still playable offline.
 */
export async function ensureSession(visitorName?: string): Promise<string> {
  const existing = getSessionId();
  if (existing) return existing;

  try {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorName: visitorName ?? null }),
    });
    if (res.ok) {
      const data = (await res.json()) as { sessionId?: string };
      if (data.sessionId) {
        write(KEY_SESSION, data.sessionId);
        return data.sessionId;
      }
    }
  } catch {
    /* fall through to local id */
  }

  const id = localId();
  write(KEY_SESSION, id);
  return id;
}

/* -------------------------------- answers ------------------------------- */

export function getAnswers(): AnswerMap {
  return read<AnswerMap>(KEY_ANSWERS, {});
}

export function getAnswer(stepNumber: number): StoredAnswer | undefined {
  return getAnswers()[String(stepNumber)];
}

export function getVisitorName(): string {
  return read<string>(KEY_NAME, "");
}

export function setVisitorName(name: string): void {
  write(KEY_NAME, name);
}

export function getLastStep(): number {
  const n = read<number>(KEY_STEP, 1);
  return Math.min(Math.max(n, 1), TOTAL_STEPS);
}

export function setLastStep(n: number): void {
  write(KEY_STEP, n);
}

export function answeredCount(): number {
  return Object.keys(getAnswers()).length;
}

/**
 * Persist one answer. Writes locally, then mirrors to the API (plus any
 * previously-failed writes sitting in the retry queue). Never throws.
 */
export async function saveAnswer(
  stepNumber: number,
  question: string,
  answer: string,
  opts: { completed?: boolean; visitorName?: string } = {}
): Promise<void> {
  const answers = getAnswers();
  answers[String(stepNumber)] = { stepNumber, question, answer };
  write(KEY_ANSWERS, answers);

  if (opts.visitorName) setVisitorName(opts.visitorName);

  const sessionId = await ensureSession(opts.visitorName ?? getVisitorName());
  const queue = read<StoredAnswer[]>(KEY_QUEUE, []);
  const batch = [...queue, { stepNumber, question, answer }];

  try {
    const res = await fetch("/api/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        visitorName: (opts.visitorName ?? getVisitorName()) || null,
        completed: opts.completed ?? false,
        answers: batch,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    write(KEY_QUEUE, []);
  } catch {
    // Keep it for the next attempt rather than dropping the answer.
    write(KEY_QUEUE, batch.slice(-TOTAL_STEPS));
  }
}

/** Wipe local state so the same browser can replay from scratch. */
export function resetRun(): void {
  if (typeof window === "undefined") return;
  for (const k of [KEY_SESSION, KEY_NAME, KEY_ANSWERS, KEY_QUEUE, KEY_STEP]) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}
