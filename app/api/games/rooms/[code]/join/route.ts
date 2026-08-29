import { newPlayerToken } from "@/lib/games/codes";
import { findRoom, serializeRoom } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import {
  cleanCode,
  cleanEmoji,
  cleanName,
  isValidName,
  MAX_PLAYERS,
} from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/games/rooms/:code/join — take a seat.
 *
 * Body: { name, emoji?, token? }
 * Returns: { token, state }
 *
 * Passing a token you already hold is how a refresh, a dropped connection or
 * a reopened tab gets you back to your own score instead of a second seat.
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const code = cleanCode((await ctx.params).code);
  if (!code) return fail("bad_code", 400);

  const body = await readJson(req);
  const name = cleanName(body.name);
  if (!isValidName(name)) return fail("bad_name", 400, "Names are 2 to 16 characters.");

  try {
    const room = await findRoom(code);
    if (!room) return fail("no_room", 404, "No room with that code.");

    const existingToken = tokenFrom(req, body);
    const mine = existingToken ? room.players.find((p) => p.token === existingToken) : undefined;

    if (mine) {
      // Already seated — treat this as a rename rather than a rejection.
      const clash = room.players.find((p) => p.id !== mine.id && sameName(p.name, name));
      if (clash) return fail("name_taken", 409, `${name} is already in this room.`);

      await prisma.gamePlayer.update({
        where: { id: mine.id },
        data: { name, emoji: cleanEmoji(body.emoji), lastSeenAt: new Date() },
      });
      const fresh = await findRoom(code);
      return ok({ token: mine.token, state: await serializeRoom(fresh!, mine.token) });
    }

    if (room.players.length >= MAX_PLAYERS) {
      return fail("room_full", 409, `This room is full at ${MAX_PLAYERS} players.`);
    }
    if (room.players.some((p) => sameName(p.name, name))) {
      return fail("name_taken", 409, `${name} is already in this room. Pick another.`);
    }
    if (room.status === "finished") {
      return fail("room_finished", 409, "That game has already finished.");
    }

    const token = newPlayerToken();
    await prisma.gamePlayer.create({
      data: {
        roomId: room.id,
        token,
        name,
        emoji: cleanEmoji(body.emoji),
        isHost: room.players.length === 0, // an abandoned room adopts the next arrival
      },
    });

    const fresh = await findRoom(code);
    return ok({ token, state: await serializeRoom(fresh!, token) });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return fail("name_taken", 409, "Someone just took that name. Try another.");
    }
    console.error("[api/games/join] failed", err);
    return fail("db_error", 503);
  }
}

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
