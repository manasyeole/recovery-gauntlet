import { getGame } from "@/lib/games/catalog";
import { cardCount } from "@/lib/games/cards";
import { ensureCards } from "@/lib/games/cards/sync";
import { newPlayerToken, newRoomCode } from "@/lib/games/codes";
import { dealDeck, drawEvents, openingHand } from "@/lib/games/deal";
import { isUniqueViolation, serializeDuel, sweepExpiredDuels } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase } from "@/lib/games/http";
import {
  BOT_EMOJI,
  BOT_NAMES,
  cleanDifficulty,
  cleanEmoji,
  cleanName,
  CODE_LENGTH,
  DECK_SIZE,
  isValidName,
  MAX_ROUNDS_CHOICES,
  START_HP,
  TURN_SECONDS_CHOICES,
} from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Duels are disposable — long enough for an evening, short enough to forget. */
const DUEL_TTL_MS = 6 * 60 * 60 * 1000;

function pickOne<T extends number>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const n = Number(raw);
  return allowed.find((v) => v === n) ?? fallback;
}

/**
 * POST /api/games/rooms — open a duel and seat its host.
 *
 * Body: { gameSlug, name, emoji?, mode?, difficulty?, maxRounds?, turnSeconds? }
 * Returns: { code, token, state }
 *
 * Both decks and the whole event plan are drawn here and stored on the duel,
 * so every later request is a lookup. See the notes on Duel.eventIds and
 * Duelist.deck.
 *
 * `mode: "solo"` seats the bot in the same breath, which is why solo and room
 * duels are one code path and not two: the bot is a duelist with `isBot` set,
 * and everything downstream — the clock, the clash, the reveal — cannot tell
 * the difference.
 */
export async function POST(req: Request) {
  const noDb = requireDatabase();
  if (noDb) return noDb;

  const body = await readJson(req);

  const game = getGame(typeof body.gameSlug === "string" ? body.gameSlug : null);
  if (!game) return fail("unknown_game", 400, "Pick one of the decks on the shelf.");

  const name = cleanName(body.name);
  if (!isValidName(name)) return fail("bad_name", 400, "Names are 2 to 16 characters.");

  if (cardCount(game.slug) < DECK_SIZE) {
    return fail("empty_roster", 500, "That deck has no cards yet.");
  }

  const solo = body.mode === "solo";
  const difficulty = cleanDifficulty(body.difficulty);
  const turnSeconds = pickOne(body.turnSeconds, TURN_SECONDS_CHOICES, 25);
  const maxRounds = pickOne(body.maxRounds, MAX_ROUNDS_CHOICES, 12);

  const token = newPlayerToken();
  const eventIds = JSON.stringify(drawEvents(game.slug, maxRounds));

  // Housekeeping and the card mirror, both on the slow path on purpose —
  // this is the one request an extra hundred milliseconds doesn't spoil.
  await sweepExpiredDuels();
  await ensureCards();

  /** A fresh ten cards, split into the four they open on and the six behind. */
  const seatFor = (opts: { token: string; name: string; emoji: string; seat: number; bot: boolean }) => {
    const deck = dealDeck(game.slug);
    const { hand, rest } = openingHand(deck);
    return {
      token: opts.token,
      name: opts.name,
      emoji: opts.emoji,
      seat: opts.seat,
      isHost: opts.seat === 0,
      isBot: opts.bot,
      hp: START_HP,
      deck: JSON.stringify(rest),
      hand: JSON.stringify(hand),
      discard: JSON.stringify([]),
    };
  };

  const botName = uniqueBotName(BOT_NAMES[difficulty], name);

  // Codes are short enough to collide eventually. Retry on the unique index
  // rather than pre-checking, which would still race.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newRoomCode();
    try {
      const duel = await prisma.duel.create({
        data: {
          code,
          gameSlug: game.slug,
          mode: solo ? "solo" : "room",
          difficulty,
          maxRounds,
          turnSeconds,
          startHp: START_HP,
          eventIds,
          expiresAt: new Date(Date.now() + DUEL_TTL_MS),
          duelists: {
            create: solo
              ? [
                  seatFor({ token, name, emoji: cleanEmoji(body.emoji), seat: 0, bot: false }),
                  seatFor({ token: newPlayerToken(), name: botName, emoji: BOT_EMOJI, seat: 1, bot: true }),
                ]
              : [seatFor({ token, name, emoji: cleanEmoji(body.emoji), seat: 0, bot: false })],
          },
        },
        include: { duelists: { orderBy: { seat: "asc" } } },
      });

      return ok({ code: duel.code, token, state: await serializeDuel(duel, token) });
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      console.error("[api/games/rooms] create failed", err);
      return fail("db_error", 503);
    }
  }

  console.error(`[api/games/rooms] could not find a free ${CODE_LENGTH}-character code`);
  return fail("code_exhausted", 503, "Could not open a duel. Try again.");
}

/**
 * The (duelId, name) index does not care that one of them is a robot, so a
 * player called "The House" would collide with the bot and fail the create.
 */
function uniqueBotName(preferred: string, humanName: string): string {
  if (preferred.toLowerCase() !== humanName.toLowerCase()) return preferred;
  return `${preferred} II`;
}
