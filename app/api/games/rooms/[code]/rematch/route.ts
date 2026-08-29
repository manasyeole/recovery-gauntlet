import { randomInt } from "node:crypto";
import { findRoom, plannedIds, serializeRoom } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode } from "@/lib/games/protocol";
import { bankFor } from "@/lib/games/questions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/games/rooms/:code/rematch — same room, same people, new questions.
 *
 * Keeps the code so nobody has to re-share it, wipes the scores, and draws a
 * fresh set of questions that avoids the ones just played where the bank is
 * big enough to allow it.
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
    const room = await findRoom(code);
    if (!room) return fail("no_room", 404);

    const me = room.players.find((p) => p.token === token);
    if (!me?.isHost) return fail("not_host", 403, "Only the host can start a rematch.");
    if (room.status !== "finished") return fail("not_finished", 409, "That game is still running.");

    const bank = bankFor(room.gameSlug);
    const justPlayed = new Set(plannedIds(room));
    const unseen = bank.filter((q) => !justPlayed.has(q.id));
    // Fall back to the whole bank once it can no longer fill a fresh round.
    const pool = unseen.length >= room.totalRounds ? unseen : bank;

    const ids = shuffled(pool)
      .slice(0, Math.min(room.totalRounds, pool.length))
      .map((q) => q.id);

    await prisma.$transaction([
      prisma.gameAnswer.deleteMany({ where: { roomId: room.id } }),
      prisma.gamePlayer.updateMany({
        where: { roomId: room.id },
        data: { score: 0, streak: 0 },
      }),
      prisma.gameRoom.update({
        where: { id: room.id },
        data: {
          status: "lobby",
          currentRound: 0,
          totalRounds: ids.length,
          questionIds: JSON.stringify(ids),
          phaseEndsAt: null,
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      }),
    ]);

    const fresh = await findRoom(code);
    return ok({ state: await serializeRoom(fresh!, token) });
  } catch (err) {
    console.error("[api/games/rematch] failed", err);
    return fail("db_error", 503);
  }
}

function shuffled<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
