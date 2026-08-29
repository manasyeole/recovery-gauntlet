import {
  endRoundIfEveryoneAnswered,
  findRoom,
  questionForRound,
  serializeRoom,
} from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode, scoreAnswer } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A tap that left the phone just before the buzzer shouldn't be punished for
 * the round trip. Anything later than this is genuinely late.
 */
const LATENCY_GRACE_MS = 1_000;

/**
 * POST /api/games/rooms/:code/answer — lock one answer in.
 *
 * Body: { round, choice }
 *
 * Timing is taken from the server's own `phaseEndsAt`, never from the client's
 * claim about how fast it was, and the unique index on (playerId, round)
 * makes the first tap final even if two requests race.
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const code = cleanCode((await ctx.params).code);
  if (!code) return fail("bad_code", 400);

  const body = await readJson(req);
  const token = tokenFrom(req, body);
  if (!token) return fail("no_token", 401);

  const choice = Number(body.choice);
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return fail("bad_choice", 400);

  try {
    const room = await findRoom(code);
    if (!room) return fail("no_room", 404);

    const me = room.players.find((p) => p.token === token);
    if (!me) return fail("not_in_room", 403);

    if (room.status !== "question") return fail("not_accepting", 409, "That round is over.");

    // The client sends the round it *thinks* it is answering. If the room has
    // moved on since the question rendered, the tap belongs to a dead round.
    const claimed = Number(body.round);
    if (Number.isInteger(claimed) && claimed !== room.currentRound) {
      return fail("stale_round", 409, "That question has already gone.");
    }

    const question = questionForRound(room, room.currentRound);
    if (!question || !room.phaseEndsAt) return fail("no_question", 409);

    const roundMs = room.roundSeconds * 1000;
    const msLeft = room.phaseEndsAt.getTime() - Date.now();
    if (msLeft < -LATENCY_GRACE_MS) return fail("too_late", 409, "The clock beat you.");

    const msTaken = Math.min(roundMs, Math.max(0, roundMs - msLeft));
    const correct = choice === question.answer;
    const points = scoreAnswer({ correct, msTaken, roundMs, streak: me.streak });

    await prisma.$transaction([
      prisma.gameAnswer.create({
        data: {
          roomId: room.id,
          playerId: me.id,
          round: room.currentRound,
          choice,
          correct,
          points,
          msTaken,
        },
      }),
      prisma.gamePlayer.update({
        where: { id: me.id },
        data: {
          score: { increment: points },
          streak: correct ? { increment: 1 } : { set: 0 },
          lastSeenAt: new Date(),
        },
      }),
    ]);

    await endRoundIfEveryoneAnswered(room);

    const fresh = await findRoom(code);
    return ok({ state: await serializeRoom(fresh!, token) });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      // Already answered this round. Not an error worth showing anyone.
      const fresh = await findRoom(code);
      if (fresh) return ok({ state: await serializeRoom(fresh, token) });
    }
    console.error("[api/games/answer] failed", err);
    return fail("db_error", 503);
  }
}
