import { dealDeck, drawEvents, openingHand } from "@/lib/games/deal";
import { findDuel, serializeDuel } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DUEL_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * POST /api/games/rooms/:code/rematch — same code, same chairs, new decks.
 *
 * Everything about the duel is reset except who is sitting in it: health back
 * up, turns wiped, a fresh ten cards each and a fresh event plan. Keeping the
 * code means nobody has to read six characters out a second time.
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const code = cleanCode((await ctx.params).code);
  if (!code) return fail("bad_code", 400);

  const body = await readJson(req);
  const token = tokenFrom(req, body);
  if (!token) return fail("no_token", 401);

  try {
    const duel = await findDuel(code);
    if (!duel) return fail("no_room", 404);

    const me = duel.duelists.find((d) => d.token === token);
    if (!me?.isHost) return fail("not_host", 403, "Only the host can start a rematch.");
    if (duel.status !== "finished") return fail("not_finished", 409, "That duel is still running.");

    // New decks are dealt outside the transaction — dealDeck is pure CPU and
    // there is no reason to hold a transaction open across it.
    const fresh = duel.duelists.map((d) => {
      const { hand, rest } = openingHand(dealDeck(duel.gameSlug));
      return { id: d.id, hand: JSON.stringify(hand), deck: JSON.stringify(rest) };
    });

    await prisma.$transaction([
      prisma.duelTurn.deleteMany({ where: { duelId: duel.id } }),
      ...fresh.map((f) =>
        prisma.duelist.update({
          where: { id: f.id },
          data: {
            hp: duel.startHp,
            damageDealt: 0,
            roundsWon: 0,
            hand: f.hand,
            deck: f.deck,
            discard: JSON.stringify([]),
          },
        })
      ),
      prisma.duel.update({
        where: { id: duel.id },
        data: {
          status: "lobby",
          currentRound: 0,
          winnerSeat: null,
          phaseEndsAt: null,
          eventIds: JSON.stringify(drawEvents(duel.gameSlug, duel.maxRounds)),
          expiresAt: new Date(Date.now() + DUEL_TTL_MS),
        },
      }),
    ]);

    const after = await findDuel(code);
    return ok({ state: await serializeDuel(after!, token) });
  } catch (err) {
    console.error("[api/games/rematch] failed", err);
    return fail("db_error", 503);
  }
}
