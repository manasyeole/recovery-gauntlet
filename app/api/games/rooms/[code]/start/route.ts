import { findRoom, questionForRound, serializeRoom } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/games/rooms/:code/start — host puts the first question up.
 *
 * Guarded by a conditional update on `status: "lobby"`, so a double tap on a
 * laggy phone starts the game once.
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
    if (!me) return fail("not_in_room", 403);
    if (!me.isHost) return fail("not_host", 403, "Only the host can start the game.");
    if (room.status !== "lobby") return fail("already_started", 409);
    if (!questionForRound(room, 1)) return fail("empty_bank", 500);

    await prisma.gameRoom.updateMany({
      where: { id: room.id, status: "lobby" },
      data: {
        status: "question",
        currentRound: 1,
        phaseEndsAt: new Date(Date.now() + room.roundSeconds * 1000),
      },
    });

    const fresh = await findRoom(code);
    return ok({ state: await serializeRoom(fresh!, token) });
  } catch (err) {
    console.error("[api/games/start] failed", err);
    return fail("db_error", 503);
  }
}
