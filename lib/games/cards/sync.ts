// Server-only: pulls in Prisma. Never import this from a "use client" file.
import { GAMES } from "@/lib/games/catalog";
import { prisma } from "@/lib/prisma";
import { cardKey, ROSTERS } from "./index";
import { statTotal } from "./types";

/**
 * Mirrors the seven rosters into the Card table.
 *
 * The definitions live in TypeScript and this copies them into Postgres. That
 * split is deliberate and worth being clear about, because "the cards are in
 * the database" can mean two different things and only one of them is a good
 * idea:
 *
 *   - What a card *is* — its six numbers, its move, its rarity — is content.
 *     It belongs in the repo, in a diff, behind `npm run check:cards`, and it
 *     must not be editable from outside a deploy. A duel in progress holds
 *     card ids; if someone could change Undertaker's Power mid-duel, the
 *     replay in DuelTurn would stop describing the duel that happened.
 *
 *   - What a card has *done* — how often it has been played, how often it
 *     won, how much damage it has put on people — is exactly the thing a
 *     constant array cannot hold. That accumulates here.
 *
 * So a sync overwrites the first half and never touches the second.
 */

/** Set once a sync has completed in this process. */
let synced = false;

/** How many rows a complete Card table has. Cheap to compare against. */
export const EXPECTED_CARDS = GAMES.reduce(
  (n, g) => n + (ROSTERS[g.slug]?.cards.length ?? 0),
  0
);

/**
 * Makes sure the Card table matches the rosters, doing nothing at all in the
 * common case.
 *
 * Called from the duel-creation path rather than from a build step, because
 * the build runs before Postgres is necessarily attached (see
 * scripts/migrate.mjs, which has the same problem and the same answer). The
 * cost of that is one `count` on a cold serverless instance; after the first
 * call the module-level flag makes it free.
 *
 * Never throws. A duel that starts against a stale Card table still plays
 * correctly — the rosters in the bundle are what the engine actually reads —
 * so a failure here is a reporting problem, not a gameplay one.
 */
export async function ensureCards(): Promise<void> {
  if (synced) return;
  try {
    const have = await prisma.card.count();
    if (have === EXPECTED_CARDS) {
      synced = true;
      return;
    }
    await syncCards();
    synced = true;
  } catch (err) {
    console.error("[cards/sync] could not sync the card table", err);
  }
}

/**
 * Writes every card, unconditionally. Exported separately so it can be
 * forced after a roster change without waiting for the count to disagree —
 * editing a stat line leaves the row count identical.
 */
export async function syncCards(): Promise<number> {
  const rows = GAMES.flatMap((game) =>
    (ROSTERS[game.slug]?.cards ?? []).map((card) => ({
      id: cardKey(game.slug, card.id),
      gameSlug: game.slug,
      cardId: card.id,
      name: card.name,
      title: card.title,
      emoji: card.emoji,
      affinity: card.affinity,
      rarity: card.rarity,
      // Keyed by label rather than positional, so a row still reads as
      // something a human recognises straight out of psql.
      stats: Object.fromEntries(game.stats.map((label, i) => [label, card.stats[i]])),
      total: statTotal(card.stats),
      abilityKind: card.ability.kind,
      abilityValue: card.ability.value,
      abilityName: card.ability.name,
      abilityText: card.ability.text,
    }))
  );

  // Upserts rather than createMany, because the counters on an existing row
  // have to survive and there is no bulk form of "write these columns, leave
  // those alone".
  //
  // Batched, though. This runs on the duel-creation request, and ninety-eight
  // sequential round trips to a remote Postgres is comfortably enough to trip
  // a serverless timeout on the first duel after a deploy. The array form of
  // $transaction pipelines them, which turns that into one wait.
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.$transaction(
      rows.slice(i, i + CHUNK).map(({ id, ...definition }) =>
        prisma.card.upsert({
          where: { id },
          create: { id, ...definition },
          update: definition,
        })
      )
    );
  }

  // A card removed from a roster keeps its row: the lifetime counters are
  // still true, and a finished duel may still reference it. Only the rosters
  // decide what is playable.
  return rows.length;
}

/* ----------------------------- the counters ------------------------------ */

export interface CardTally {
  /** `slug:id` */
  key: string;
  played: number;
  won: number;
  damage: number;
}

/**
 * Folds a resolved round into the lifetime record. Best-effort: a duel is
 * never held up, and never fails, because a statistic did not get written.
 */
export async function recordCardUse(tallies: readonly CardTally[]): Promise<void> {
  if (tallies.length === 0) return;
  try {
    await prisma.$transaction(
      tallies.map((t) =>
        prisma.card.update({
          where: { id: t.key },
          data: {
            timesPlayed: { increment: t.played },
            timesWon: { increment: t.won },
            damageDealt: { increment: t.damage },
          },
        })
      )
    );
  } catch (err) {
    // Most likely the row isn't there yet because ensureCards hasn't run in
    // this process. Not worth interrupting a duel over.
    console.error("[cards/sync] could not record card use", err);
  }
}
