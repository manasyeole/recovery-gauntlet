import {
  commitPlay,
  endRoundIfBothCommitted,
  findDuel,
  isUniqueViolation,
  playBotsFor,
  readList,
  serializeDuel,
} from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode } from "@/lib/games/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A tap that left the phone just before the buzzer shouldn't be punished for
 * the round trip. Anything later than this is genuinely late.
 */
const LATENCY_GRACE_MS = 1_000;

/**
 * POST /api/games/rooms/:code/play — put one card down, face-down.
 *
 * Body: { round, cardId, stat }
 *
 * Two things make this safe to shout at:
 *
 *   - the card has to be in *your* hand, checked against the server's copy,
 *     so the interesting request to forge is also the one that gets refused;
 *   - the unique index on (duelistId, round) makes the first tap final even
 *     if two requests race, so a double-tap cannot play two cards.
 *
 * Timing is taken from the server's own `phaseEndsAt`, never from the
 * client's claim about how fast it was.
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const code = cleanCode((await ctx.params).code);
  if (!code) return fail("bad_code", 400);

  const body = await readJson(req);
  const token = tokenFrom(req, body);
  if (!token) return fail("no_token", 401);

  const cardId = typeof body.cardId === "string" ? body.cardId : "";
  const stat = Number(body.stat);
  if (!cardId) return fail("bad_card", 400);
  if (!Number.isInteger(stat) || stat < 0 || stat > 5) return fail("bad_stat", 400);

  try {
    const duel = await findDuel(code);
    if (!duel) return fail("no_room", 404);

    const me = duel.duelists.find((d) => d.token === token);
    if (!me) return fail("not_in_room", 403);

    if (duel.status !== "clash") return fail("not_accepting", 409, "That round is over.");

    // The client sends the round it *thinks* it is playing into. If the duel
    // has moved on since the hand rendered, the tap belongs to a dead round.
    const claimed = Number(body.round);
    if (Number.isInteger(claimed) && claimed !== duel.currentRound) {
      return fail("stale_round", 409, "That round has already gone.");
    }

    // The whole security model of a card game: you may only play what you
    // hold, and the server holds the only copy of that list.
    if (!readList(me.hand).includes(cardId)) {
      return fail("not_in_hand", 409, "That card isn't in your hand.");
    }

    if (!duel.phaseEndsAt) return fail("no_round", 409);
    const roundMs = duel.turnSeconds * 1000;
    const msLeft = duel.phaseEndsAt.getTime() - Date.now();
    if (msLeft < -LATENCY_GRACE_MS) return fail("too_late", 409, "The clock beat you.");

    const msTaken = Math.min(roundMs, Math.max(0, roundMs - msLeft));

    await commitPlay({
      duel,
      duelist: me,
      round: duel.currentRound,
      cardId,
      stat,
      msTaken,
      timedOut: false,
    });

    // Solo: the bot answers immediately, so the round ends when you have
    // chosen rather than on a timer you are watching by yourself.
    if (duel.mode === "solo") await playBotsFor(duel);

    await endRoundIfBothCommitted(duel);

    const fresh = await findDuel(code);
    return ok({ state: await serializeDuel(fresh!, token) });
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Already played this round. Not an error worth showing anyone.
      const fresh = await findDuel(code);
      if (fresh) return ok({ state: await serializeDuel(fresh, token) });
    }
    console.error("[api/games/play] failed", err);
    return fail("db_error", 503);
  }
}
