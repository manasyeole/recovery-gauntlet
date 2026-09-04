import { cricket } from "./cricket";
import { football } from "./football";
import { naruto } from "./naruto";
import { onePiece } from "./one-piece";
import { pokemon } from "./pokemon";
import { racing } from "./racing";
import type { Card, GameEvent, Rarity, Roster } from "./types";
import { wwe } from "./wwe";

export type { Card, GameEvent, Rarity, Roster };
export * from "./types";

/** Keyed by the slugs in lib/games/catalog.ts. */
export const ROSTERS: Readonly<Record<string, Roster>> = {
  cricket,
  football,
  wwe,
  naruto,
  "one-piece": onePiece,
  pokemon,
  racing,
};

const EMPTY: Roster = { cards: [], events: [] };

export function rosterFor(slug: string): Roster {
  return ROSTERS[slug] ?? EMPTY;
}

export function cardsFor(slug: string): readonly Card[] {
  return rosterFor(slug).cards;
}

export function eventsFor(slug: string): readonly GameEvent[] {
  return rosterFor(slug).events;
}

export function cardCount(slug: string): number {
  return cardsFor(slug).length;
}

/** One card by its roster-local id. Undefined if the roster changed under it. */
export function findCard(slug: string, id: string): Card | undefined {
  return cardsFor(slug).find((c) => c.id === id);
}

export function findEvent(slug: string, id: string): GameEvent | undefined {
  return eventsFor(slug).find((e) => e.id === id);
}

export function cardsByRarity(slug: string, rarity: Rarity): readonly Card[] {
  return cardsFor(slug).filter((c) => c.rarity === rarity);
}

/**
 * The globally unique key a card is stored under — roster ids are only
 * unique within their own game, and the Card table holds all seven.
 */
export function cardKey(slug: string, id: string): string {
  return `${slug}:${id}`;
}

export function splitCardKey(key: string): { slug: string; id: string } | null {
  const at = key.indexOf(":");
  if (at <= 0 || at === key.length - 1) return null;
  return { slug: key.slice(0, at), id: key.slice(at + 1) };
}

/** Resolves a stored `slug:id` key straight to a card. */
export function cardFromKey(key: string): Card | undefined {
  const parts = splitCardKey(key);
  return parts ? findCard(parts.slug, parts.id) : undefined;
}
