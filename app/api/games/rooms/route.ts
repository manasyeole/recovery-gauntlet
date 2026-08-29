import { randomInt } from "node:crypto";
import { getGame } from "@/lib/games/catalog";
import { newPlayerToken, newRoomCode } from "@/lib/games/codes";
import { serializeRoom, sweepExpiredRooms } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase } from "@/lib/games/http";
import {
  cleanEmoji,
  cleanName,
  CODE_LENGTH,
  isValidName,
  ROUND_SECONDS_CHOICES,
  TOTAL_ROUNDS_CHOICES,
} from "@/lib/games/protocol";
import { bankFor } from "@/lib/games/questions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rooms are disposable — long enough for an evening, short enough to forget. */
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

/** Fisher–Yates with a CSPRNG, so the question order isn't guessable. */
function shuffled<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickOne<T extends number>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const n = Number(raw);
  return allowed.find((v) => v === n) ?? fallback;
}

/**
 * POST /api/games/rooms — open a room and seat its host.
 *
 * Body: { gameSlug, name, emoji?, totalRounds?, roundSeconds? }
 * Returns: { code, token, state }
 *
 * The whole question order is drawn here and stored on the room, so every
 * later request is a lookup. See the note on GameRoom.questionIds.
 */
export async function POST(req: Request) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const body = await readJson(req);

  const game = getGame(typeof body.gameSlug === "string" ? body.gameSlug : null);
  if (!game) return fail("unknown_game", 400, "Pick one of the games on the shelf.");

  const name = cleanName(body.name);
  if (!isValidName(name)) return fail("bad_name", 400, "Names are 2 to 16 characters.");

  const bank = bankFor(game.slug);
  if (bank.length === 0) return fail("empty_bank", 500, "That game has no questions yet.");

  const roundSeconds = pickOne(body.roundSeconds, ROUND_SECONDS_CHOICES, 20);
  // Never promise more rounds than the bank can cover.
  const totalRounds = Math.min(pickOne(body.totalRounds, TOTAL_ROUNDS_CHOICES, 10), bank.length);

  const questionIds = JSON.stringify(shuffled(bank).slice(0, totalRounds).map((q) => q.id));
  const token = newPlayerToken();

  await sweepExpiredRooms();

  // Codes are short enough to collide eventually. Retry on the unique index
  // rather than pre-checking, which would still race.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newRoomCode();
    try {
      const room = await prisma.gameRoom.create({
        data: {
          code,
          gameSlug: game.slug,
          totalRounds,
          roundSeconds,
          questionIds,
          expiresAt: new Date(Date.now() + ROOM_TTL_MS),
          players: {
            create: {
              token,
              name,
              emoji: cleanEmoji(body.emoji),
              isHost: true,
            },
          },
        },
        include: { players: true },
      });

      return ok({ code: room.code, token, state: await serializeRoom(room, token) });
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      console.error("[api/games/rooms] create failed", err);
      return fail("db_error", 503);
    }
  }

  console.error(`[api/games/rooms] could not find a free ${CODE_LENGTH}-character code`);
  return fail("code_exhausted", 503, "Could not allocate a room code. Try again.");
}

function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && err.code === "P2002");
}
