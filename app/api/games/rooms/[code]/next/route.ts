import { findDuel, serializeDuel, tick } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/games/rooms/:code/next — host cuts the current phase short.
 *
 * Rather than duplicating the state machine, this just expires the clock and
 * lets engine.tick perform the same transition it would have done a moment
 * later. One code path, one set of races to reason about.
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
    if (!me?.isHost) return fail("not_host", 403, "Only the host can skip ahead.");
    if (duel.status !== "clash" && duel.status !== "resolve") {
      return fail("nothing_to_skip", 409);
    }

    await prisma.duel.updateMany({
      where: { id: duel.id, status: duel.status, currentRound: duel.currentRound },
      data: { phaseEndsAt: new Date() },
    });
    await tick(duel.id);

    const fresh = await findDuel(code);
    return ok({ state: await serializeDuel(fresh!, token) });
  } catch (err) {
    console.error("[api/games/next] failed", err);
    return fail("db_error", 503);
  }
}
