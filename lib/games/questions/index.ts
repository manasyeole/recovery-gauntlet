import { cricket } from "./cricket";
import { football } from "./football";
import { naruto } from "./naruto";
import { onePiece } from "./one-piece";
import { pokemon } from "./pokemon";
import { racing } from "./racing";
import type { Question } from "./types";
import { wwe } from "./wwe";

export type { Question };

/** Keyed by the slugs in lib/games/catalog.ts. */
export const BANKS: Readonly<Record<string, readonly Question[]>> = {
  cricket,
  football,
  wwe,
  naruto,
  "one-piece": onePiece,
  pokemon,
  racing,
};

export function bankFor(slug: string): readonly Question[] {
  return BANKS[slug] ?? [];
}

export function questionCount(slug: string): number {
  return bankFor(slug).length;
}

/** Look one question up by id within a bank. Returns undefined if it moved. */
export function findQuestion(slug: string, id: string): Question | undefined {
  return bankFor(slug).find((q) => q.id === id);
}
