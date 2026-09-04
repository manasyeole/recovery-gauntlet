// Server-only: pulls in node:crypto. Never import this from a "use client"
// file — the deal is the one thing a browser must not be able to predict.
import { randomInt } from "node:crypto";
import { cardsByRarity, eventsFor, RARITIES, RARITY_QUOTA } from "./cards";
import { DECK_SIZE, HAND_SIZE, isEventRound } from "./rules";

/** Fisher–Yates with a CSPRNG, so a deck isn't guessable from the code. */
export function shuffled<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deals one duelist ten cards.
 *
 * Both decks are drawn to the same rarity quota — four commons, three rares,
 * two epics, one legend — from a roster that holds one spare of each. So the
 * two decks are different (which is the fun) but provably equal in budget
 * (which is the fair): every deck sums to the same number, whoever gets which
 * legend. Nobody can be handed a losing hand at deal time.
 *
 * Returned in shuffled order; the first HAND_SIZE become the opening hand.
 */
export function dealDeck(slug: string): string[] {
  const picked: string[] = [];

  for (const rarity of RARITIES) {
    const pool = cardsByRarity(slug, rarity);
    const want = RARITY_QUOTA[rarity];
    picked.push(...shuffled(pool).slice(0, want).map((c) => c.id));
  }

  // A roster that is short of a rarity would quietly deal a small deck. Top
  // it up from whatever is left rather than dealing an uneven duel — the
  // check script makes sure this never actually happens.
  if (picked.length < DECK_SIZE) {
    const rest = shuffled(
      RARITIES.flatMap((r) => cardsByRarity(slug, r).map((c) => c.id))
    ).filter((id) => !picked.includes(id));
    picked.push(...rest.slice(0, DECK_SIZE - picked.length));
  }

  return shuffled(picked).slice(0, DECK_SIZE);
}

/** The opening split: what is in hand, and what is left to draw from. */
export function openingHand(deck: readonly string[]): { hand: string[]; rest: string[] } {
  return { hand: [...deck.slice(0, HAND_SIZE)], rest: [...deck.slice(HAND_SIZE)] };
}

/**
 * The event for every round of a duel, drawn up front — nulls on the quiet
 * rounds. Index 0 is round 1.
 *
 * Drawn at creation for the same reason the deck is: whoever polls next is
 * the one who advances the clock, and two browsers arriving in the same
 * millisecond must not each roll their own weather.
 */
export function drawEvents(slug: string, maxRounds: number): (string | null)[] {
  const pool = eventsFor(slug);
  const plan: (string | null)[] = [];
  let bag: string[] = [];

  for (let round = 1; round <= maxRounds; round++) {
    if (!isEventRound(round) || pool.length === 0) {
      plan.push(null);
      continue;
    }
    // Draw without replacement so a six-event game doesn't show the same
    // event twice before it has shown the others once.
    if (bag.length === 0) bag = shuffled(pool).map((e) => e.id);
    plan.push(bag.pop() ?? null);
  }

  return plan;
}

/**
 * Draws one duelist back up to a full hand after playing a card.
 *
 * A deck of ten across up to sixteen rounds runs out, so an empty deck is
 * reshuffled from the discard pile. Cards come back around; that is the
 * intent, and it is why the discard is stored rather than thrown away.
 */
export function drawUp(
  hand: readonly string[],
  deck: readonly string[],
  discard: readonly string[]
): { hand: string[]; deck: string[]; discard: string[] } {
  let nextHand = [...hand];
  let nextDeck = [...deck];
  let nextDiscard = [...discard];

  while (nextHand.length < HAND_SIZE) {
    if (nextDeck.length === 0) {
      if (nextDiscard.length === 0) break; // nothing left anywhere — play on short
      nextDeck = shuffled(nextDiscard);
      nextDiscard = [];
    }
    const card = nextDeck.shift();
    if (card === undefined) break;
    nextHand.push(card);
  }

  return { hand: nextHand, deck: nextDeck, discard: nextDiscard };
}
