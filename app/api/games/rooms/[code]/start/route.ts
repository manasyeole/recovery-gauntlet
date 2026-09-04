import { findDuel, serializeDuel } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode, SEATS } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/games/rooms/:code/start — host deals the first hand.
 *
 * Guarded by a conditional update on `status: "lobby"`, so a double tap on a
 * laggy phone starts the duel once.
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
    if (!me) return fail("not_in_room", 403);
    if (!me.isHost) return fail("not_host", 403, "Only the host can start the duel.");
    if (duel.status !== "lobby") return fail("already_started", 409);
    if (duel.duelists.length < SEATS) {
      return fail("need_opponent", 409, "A duel is two people. Wait for the other chair.");
    }

    await prisma.duel.updateMany({
      where: { id: duel.id, status: "lobby" },
      data: {
        status: "clash",
        currentRound: 1,
        phaseEndsAt: new Date(Date.now() + duel.turnSeconds * 1000),
      },
    });

    const fresh = await findDuel(code);
    return ok({ state: await serializeDuel(fresh!, token) });
  } catch (err) {
    console.error("[api/games/start] failed", err);
    return fail("db_error", 503);
  }
}
