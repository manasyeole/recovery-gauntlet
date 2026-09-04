import { findDuel, serializeDuel, tick } from "@/lib/games/engine";
import { fail, ok, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/games/rooms/:code — the whole duel, as this duelist may see it.
 *
 * This is the polling endpoint and therefore the heartbeat: it advances the
 * clock (see engine.tick) and marks the caller as present, so the lobby can
 * tell who is still holding a phone.
 */
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const code = cleanCode((await ctx.params).code);
  if (!code) return fail("bad_code", 400);

  const token = tokenFrom(req);

  try {
    const existing = await findDuel(code);
    if (!existing) return fail("no_room", 404, "That duel has ended or never existed.");

    await tick(existing.id);

    if (token) {
      // updateMany, not update: a stale token from a duel the player left
      // should be a no-op rather than a 500.
      await prisma.duelist.updateMany({
        where: { duelId: existing.id, token },
        data: { lastSeenAt: new Date() },
      });
    }

    const duel = await findDuel(code);
    if (!duel) return fail("no_room", 404);

    return ok({ state: await serializeDuel(duel, token) });
  } catch (err) {
    console.error("[api/games/rooms/:code] read failed", err);
    return fail("db_error", 503);
  }
}
