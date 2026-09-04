import { newPlayerToken } from "@/lib/games/codes";
import { dealDeck, openingHand } from "@/lib/games/deal";
import { findDuel, isUniqueViolation, serializeDuel } from "@/lib/games/engine";
import { fail, ok, readJson, requireDatabase, tokenFrom } from "@/lib/games/http";
import { cleanCode, cleanEmoji, cleanName, isValidName, SEATS } from "@/lib/games/protocol";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/games/rooms/:code/join — take the other chair.
 *
 * Body: { name, emoji?, token? }
 * Returns: { token, state }
 *
 * Passing a token you already hold is how a refresh, a dropped connection or
 * a reopened tab gets you back to your own hand rather than a second seat —
 * which in a two-seat game would mean no seat at all.
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
    const duel = await findDuel(code);
    if (!duel) return fail("no_room", 404, "No duel with that code.");

    const existingToken = tokenFrom(req, body);
    const mine = existingToken ? duel.duelists.find((d) => d.token === existingToken) : undefined;

    if (mine) {
      // Already seated — treat this as a rename rather than a rejection.
      const clash = duel.duelists.find((d) => d.id !== mine.id && sameName(d.name, name));
      if (clash) return fail("name_taken", 409, `${name} is already in this duel.`);

      await prisma.duelist.update({
        where: { id: mine.id },
        data: { name, emoji: cleanEmoji(body.emoji), lastSeenAt: new Date() },
      });
      const fresh = await findDuel(code);
      return ok({ token: mine.token, state: await serializeDuel(fresh!, mine.token) });
    }

    if (duel.mode === "solo") {
      return fail("solo_duel", 409, "That one is against the computer. Start your own duel.");
    }
    if (duel.duelists.length >= SEATS) {
      return fail("room_full", 409, "Both chairs are taken. A duel is two people.");
    }
    if (duel.duelists.some((d) => sameName(d.name, name))) {
      return fail("name_taken", 409, `${name} is already in this duel. Pick another.`);
    }
    if (duel.status === "finished") {
      return fail("room_finished", 409, "That duel is already over.");
    }
    if (duel.status !== "lobby") {
      return fail("already_started", 409, "That duel is already under way.");
    }

    // The seat that isn't taken. In practice always 1, but derived rather
    // than assumed, so an abandoned host doesn't wedge the duel.
    const taken = new Set(duel.duelists.map((d) => d.seat));
    const seat = [...Array(SEATS).keys()].find((s) => !taken.has(s));
    if (seat === undefined) return fail("room_full", 409, "Both chairs are taken.");

    const token = newPlayerToken();
    const deck = dealDeck(duel.gameSlug);
    const { hand, rest } = openingHand(deck);

    await prisma.duelist.create({
      data: {
        duelId: duel.id,
        token,
        name,
        emoji: cleanEmoji(body.emoji),
        seat,
        // An abandoned duel adopts the next arrival rather than being stuck
        // waiting for a host who closed the tab.
        isHost: duel.duelists.length === 0,
        hp: duel.startHp,
        deck: JSON.stringify(rest),
        hand: JSON.stringify(hand),
        discard: JSON.stringify([]),
      },
    });

    const fresh = await findDuel(code);
    return ok({ token, state: await serializeDuel(fresh!, token) });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail("name_taken", 409, "Someone just took that name or seat. Try again.");
    }
    console.error("[api/games/join] failed", err);
    return fail("db_error", 503);
  }
}

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
