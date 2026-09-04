// Server-only: pulls in Prisma and, by way of ./deal, node:crypto. Never
// import this from a "use client" file — reach for ./protocol instead, which
// is the half both sides are allowed to share.
import type { Duel, Duelist, DuelTurn } from "@prisma/client";
import { getGame, type Game } from "@/lib/games/catalog";
import { prisma } from "@/lib/prisma";
import { botPlay } from "./ai";
import { bestStat, findCard, findEvent, cardKey, type Card, type GameEvent } from "./cards";
import { recordCardUse, type CardTally } from "./cards/sync";
import { drawUp } from "./deal";
import {
  AWAY_MS,
  RESOLVE_MS,
  resolveClash,
  verdict,
  type ClashPlay,
  type Difficulty,
  type DuelMode,
  type DuelState,
  type DuelStatus,
  type LogLine,
  type PublicDuelist,
  type Reveal,
} from "./protocol";

export type DuelWithDuelists = Duel & { duelists: Duelist[] };

/** How many rounds of history the sidebar keeps. */
const LOG_LINES = 8;

/* ------------------------------- loading -------------------------------- */

export async function findDuel(code: string): Promise<DuelWithDuelists | null> {
  if (!code) return null;
  return prisma.duel.findUnique({
    where: { code },
    include: { duelists: { orderBy: { seat: "asc" } } },
  });
}

/** Parses one of the JSON string columns. Never throws; a broken one is empty. */
export function readList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** The event plan drawn at creation: one slot per round, null on quiet ones. */
export function plannedEvents(duel: Duel): (string | null)[] {
  if (!duel.eventIds) return [];
  try {
    const parsed: unknown = JSON.parse(duel.eventIds);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => (typeof x === "string" ? x : null));
  } catch {
    return [];
  }
}

/** The event for a 1-based round, or null. */
export function eventForRound(duel: Duel, round: number): GameEvent | null {
  const id = plannedEvents(duel)[round - 1];
  return id ? findEvent(duel.gameSlug, id) ?? null : null;
}

function gameOf(duel: Duel): Game {
  const game = getGame(duel.gameSlug);
  if (!game) throw new Error(`duel ${duel.code} refers to unknown game ${duel.gameSlug}`);
  return game;
}

function cardOf(duel: Duel, id: string): Card | undefined {
  return findCard(duel.gameSlug, id);
}

/* ------------------------------ the clock -------------------------------- */

/**
 * Moves the duel forward if its current phase has run out.
 *
 * There is no scheduler and no socket server: whoever polls next does the
 * work. Every transition is guarded so that six requests arriving in the same
 * millisecond produce exactly one advance — the losers see the guard fail and
 * simply re-read.
 *
 * Loops, because a duel nobody looked at for a minute may owe several
 * transitions at once; capped so a stuck duel can never spin here.
 */
export async function tick(duelId: string): Promise<void> {
  for (let guard = 0; guard < 6; guard++) {
    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: { duelists: { orderBy: { seat: "asc" } } },
    });
    if (!duel || !duel.phaseEndsAt) return;
    if (duel.phaseEndsAt.getTime() > Date.now()) return;

    if (duel.status === "clash") {
      if (!(await resolveRound(duel))) return;
    } else if (duel.status === "resolve") {
      if (!(await openNextRound(duel))) return;
    } else {
      return;
    }
  }
}

/* ------------------------------ the round -------------------------------- */

/** Whatever a duelist who ran out of clock is deemed to have done. */
function fallbackPlay(duel: Duel, duelist: Duelist): { cardId: string; stat: number } | null {
  const hand = readList(duelist.hand);
  const first = hand.map((id) => cardOf(duel, id)).find((c): c is Card => Boolean(c));
  if (!first) return null;
  // Their best stat, so a missed round is unlucky rather than a forfeit.
  return { cardId: first.id, stat: bestStat(first.stats) };
}

/** What the bot would do, right now, with what it can see. */
export function botTurnFor(
  duel: DuelWithDuelists,
  duelist: Duelist,
  round: number
): { cardId: string; stat: number } | null {
  const hand = readList(duelist.hand);
  if (hand.length === 0) return null;

  const opponent = duel.duelists.find((d) => d.id !== duelist.id);

  try {
    return botPlay({
      game: gameOf(duel),
      hand,
      hp: duelist.hp,
      opponentHp: opponent?.hp ?? duel.startHp,
      startHp: duel.startHp,
      // What the other side has shown so far — everything they've discarded.
      opponentSeen: opponent ? readList(opponent.discard) : [],
      event: eventForRound(duel, round),
      difficulty: duel.difficulty as Difficulty,
    });
  } catch {
    return fallbackPlay(duel, duelist);
  }
}

/**
 * Writes one duelist's play, face-down. Shared by the play route, the bot,
 * and the timeout path, so all three land in the database the same shape.
 *
 * The unique index on (duelistId, round) is what makes the first commit final
 * even if two requests race; callers treat a P2002 as "already played".
 */
export async function commitPlay(opts: {
  duel: Duel;
  duelist: Duelist;
  round: number;
  cardId: string;
  stat: number;
  msTaken: number;
  timedOut: boolean;
}): Promise<void> {
  await prisma.duelTurn.create({
    data: {
      duelId: opts.duel.id,
      duelistId: opts.duelist.id,
      round: opts.round,
      seat: opts.duelist.seat,
      cardId: opts.cardId,
      stat: opts.stat,
      msTaken: opts.msTaken,
      timedOut: opts.timedOut,
    },
  });
}

/**
 * Turns both cards over, does the arithmetic, and writes the consequences.
 *
 * Everything happens inside one interactive transaction, opened by a
 * conditional update on the duel row. That update is the lock: a second
 * request trying to resolve the same round blocks on it, and when it gets in
 * the round has moved on and it matches nothing. So the clash is resolved
 * exactly once no matter how many browsers noticed the clock at the same
 * moment.
 *
 * Returns false when someone else got there first.
 */
export async function resolveRound(duel: DuelWithDuelists): Promise<boolean> {
  const round = duel.currentRound;
  const game = gameOf(duel);
  const event = eventForRound(duel, round);

  const [seat0, seat1] = [
    duel.duelists.find((d) => d.seat === 0),
    duel.duelists.find((d) => d.seat === 1),
  ];
  if (!seat0 || !seat1) return false;

  // Collected inside the transaction, written outside it. Cleared on entry so
  // a retried transaction cannot double-count a card's lifetime record.
  let tallies: CardTally[] = [];

  const done = await prisma.$transaction(async (tx) => {
    tallies = [];

    // The guard and the lock, in one. Everything below is safe because this
    // matched, and nothing else can match it again.
    const { count } = await tx.duel.updateMany({
      where: { id: duel.id, status: "clash", currentRound: round },
      data: { status: "resolve", phaseEndsAt: new Date(Date.now() + RESOLVE_MS) },
    });
    if (count === 0) return false;

    const existing = await tx.duelTurn.findMany({ where: { duelId: duel.id, round } });

    // Anyone who didn't commit gets played for them — a bot by its own
    // judgement, a person by their best stat.
    const playFor = async (duelist: Duelist): Promise<DuelTurn | null> => {
      const already = existing.find((t) => t.duelistId === duelist.id);
      if (already) return already;

      const pick = duelist.isBot
        ? botTurnFor(duel, duelist, round) ?? fallbackPlay(duel, duelist)
        : fallbackPlay(duel, duelist);
      if (!pick) return null;

      return tx.duelTurn.create({
        data: {
          duelId: duel.id,
          duelistId: duelist.id,
          round,
          seat: duelist.seat,
          cardId: pick.cardId,
          stat: pick.stat,
          timedOut: true,
          msTaken: duel.turnSeconds * 1000,
        },
      });
    };

    const turn0 = await playFor(seat0);
    const turn1 = await playFor(seat1);
    if (!turn0 || !turn1) return false;

    const card0 = cardOf(duel, turn0.cardId);
    const card1 = cardOf(duel, turn1.cardId);
    if (!card0 || !card1) return false;

    const clash = resolveClash({
      game,
      a: { card: card0, stat: turn0.stat, hp: seat0.hp, startHp: duel.startHp },
      b: { card: card1, stat: turn1.stat, hp: seat1.hp, startHp: duel.startHp },
      event,
    });

    // Write both sides' results and move both hands on.
    const settle = async (
      duelist: Duelist,
      turn: DuelTurn,
      result: (typeof clash)["a"],
      won: boolean
    ) => {
      await tx.duelTurn.update({
        where: { id: turn.id },
        data: {
          dealt: result.dealt,
          taken: result.taken,
          healed: result.healed,
          hpAfter: result.hpAfter,
        },
      });

      // The card played leaves the hand for the discard, and the hand is
      // topped back up — reshuffling the discard if the deck has run dry.
      const hand = readList(duelist.hand).filter((id) => id !== turn.cardId);
      const discard = [...readList(duelist.discard), turn.cardId];
      const next = drawUp(hand, readList(duelist.deck), discard);

      await tx.duelist.update({
        where: { id: duelist.id },
        data: {
          hp: result.hpAfter,
          damageDealt: { increment: result.dealt },
          roundsWon: won ? { increment: 1 } : undefined,
          hand: JSON.stringify(next.hand),
          deck: JSON.stringify(next.deck),
          discard: JSON.stringify(next.discard),
        },
      });

      tallies.push({
        key: cardKey(duel.gameSlug, turn.cardId),
        played: 1,
        won: won ? 1 : 0,
        damage: result.dealt,
      });
    };

    await settle(seat0, turn0, clash.a, clash.roundWinner === "a");
    await settle(seat1, turn1, clash.b, clash.roundWinner === "b");

    return true;
  });

  if (done) {
    // Lifetime card statistics, outside the transaction: they are a nice
    // thing to have and never a reason to fail a round.
    void recordCardUse(tallies);
  }
  return done;
}

/** resolve → the next clash, or the end of the duel. */
async function openNextRound(duel: DuelWithDuelists): Promise<boolean> {
  const [seat0, seat1] = [
    duel.duelists.find((d) => d.seat === 0),
    duel.duelists.find((d) => d.seat === 1),
  ];
  if (!seat0 || !seat1) return false;

  const call = verdict(
    { hp: seat0.hp, damageDealt: seat0.damageDealt },
    { hp: seat1.hp, damageDealt: seat1.damageDealt },
    duel.currentRound,
    duel.maxRounds
  );

  const { count } = await prisma.duel.updateMany({
    where: { id: duel.id, status: "resolve", currentRound: duel.currentRound },
    data:
      call === null
        ? {
            status: "clash",
            currentRound: duel.currentRound + 1,
            phaseEndsAt: new Date(Date.now() + duel.turnSeconds * 1000),
          }
        : {
            status: "finished",
            phaseEndsAt: null,
            winnerSeat: call === "draw" ? -1 : call === "a" ? 0 : 1,
          },
  });
  return count > 0;
}

/**
 * Called after a play lands: if nobody is left to commit, pull the end of the
 * round forward rather than making everyone watch a dead timer. The next poll
 * handles the transition through the same path as a natural expiry.
 */
export async function endRoundIfBothCommitted(duel: DuelWithDuelists): Promise<void> {
  if (duel.status !== "clash") return;
  const committed = await prisma.duelTurn.count({
    where: { duelId: duel.id, round: duel.currentRound },
  });
  if (committed < duel.duelists.length) return;

  await prisma.duel.updateMany({
    where: { id: duel.id, status: "clash", currentRound: duel.currentRound },
    data: { phaseEndsAt: new Date() },
  });
}

/**
 * In a solo duel the bot plays the instant the person does, so the round ends
 * as soon as they have chosen rather than on a timer they are watching alone.
 * A P2002 means it had already played — nothing to do.
 */
export async function playBotsFor(duel: DuelWithDuelists): Promise<void> {
  const bots = duel.duelists.filter((d) => d.isBot);
  for (const bot of bots) {
    const pick = botTurnFor(duel, bot, duel.currentRound);
    if (!pick) continue;
    try {
      await commitPlay({
        duel,
        duelist: bot,
        round: duel.currentRound,
        cardId: pick.cardId,
        stat: pick.stat,
        msTaken: 0,
        timedOut: false,
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
}

export function isUniqueViolation(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "code" in err && err.code === "P2002");
}

/* --------------------------- serialisation ------------------------------ */

/**
 * Builds the payload one specific browser is allowed to see.
 *
 * The important rule, and the reason this is not just `JSON.stringify(duel)`:
 * a hand never leaves the server except to the person holding it, and a
 * committed play never leaves the server until both cards are turned over.
 * Nothing stops a player reading their own network tab, so the opponent's
 * choice simply isn't in it until the round is over.
 */
export async function serializeDuel(
  duel: DuelWithDuelists,
  viewerToken: string | null
): Promise<DuelState> {
  const status = duel.status as DuelStatus;
  const now = Date.now();
  const msLeft = duel.phaseEndsAt ? Math.max(0, duel.phaseEndsAt.getTime() - now) : 0;

  const me = viewerToken ? duel.duelists.find((d) => d.token === viewerToken) ?? null : null;

  // Every resolved turn, for the reveal and the log both. A duel is at most
  // sixteen rounds of two rows, so this is cheaper than two queries.
  const turns = await prisma.duelTurn.findMany({
    where: { duelId: duel.id },
    orderBy: [{ round: "asc" }, { seat: "asc" }],
  });

  const thisRound = turns.filter((t) => t.round === duel.currentRound);
  const committedIds = new Set(thisRound.map((t) => t.duelistId));

  const duelists: PublicDuelist[] = duel.duelists.map((d) => ({
    id: d.id,
    name: d.name,
    emoji: d.emoji,
    seat: d.seat,
    isHost: d.isHost,
    isBot: d.isBot,
    online: d.isBot || now - d.lastSeenAt.getTime() < AWAY_MS,
    hp: d.hp,
    handCount: readList(d.hand).length,
    deckCount: readList(d.deck).length,
    damageDealt: d.damageDealt,
    roundsWon: d.roundsWon,
    committed: committedIds.has(d.id),
    isYou: me?.id === d.id,
  }));

  /* ------------------------------ the reveal ---------------------------- */

  let reveal: Reveal | null = null;
  if (status === "resolve" || status === "finished") {
    // On `finished` the last round resolved is the one still worth showing.
    const round = status === "resolve" ? duel.currentRound : lastResolvedRound(turns);
    reveal = buildReveal(duel, turns, round);
  }

  /* -------------------------------- the log ----------------------------- */

  const byRound = new Map<number, DuelTurn[]>();
  for (const t of turns) {
    if (t.dealt === null) continue;
    const list = byRound.get(t.round) ?? [];
    list.push(t);
    byRound.set(t.round, list);
  }

  const log: LogLine[] = [...byRound.entries()]
    .filter(([, list]) => list.length === 2)
    .sort((x, y) => x[0] - y[0])
    .slice(-LOG_LINES)
    .map(([round, list]) => {
      const a = list.find((t) => t.seat === 0);
      const b = list.find((t) => t.seat === 1);
      return {
        round,
        dealt: [a?.dealt ?? 0, b?.dealt ?? 0] as [number, number],
        hp: [a?.hpAfter ?? 0, b?.hpAfter ?? 0] as [number, number],
        eventId: plannedEvents(duel)[round - 1] ?? null,
      };
    });

  /* ------------------------------- the viewer --------------------------- */

  const myTurn = me ? thisRound.find((t) => t.duelistId === me.id) : undefined;

  return {
    code: duel.code,
    gameSlug: duel.gameSlug,
    mode: duel.mode as DuelMode,
    status,
    round: duel.currentRound,
    maxRounds: duel.maxRounds,
    turnSeconds: duel.turnSeconds,
    startHp: duel.startHp,
    msLeft,
    eventId: plannedEvents(duel)[duel.currentRound - 1] ?? null,
    duelists,
    viewer: me
      ? {
          id: me.id,
          seat: me.seat,
          isHost: me.isHost,
          hand: readList(me.hand),
          committed: myTurn ? { cardId: myTurn.cardId, stat: myTurn.stat } : null,
        }
      : null,
    reveal,
    log,
    winnerSeat: duel.winnerSeat,
  };
}

/**
 * Turns two stored plays back into everything the reveal screen wants to say.
 *
 * DuelTurn keeps the outcome — damage, health after — because that is what
 * the duel actually is. It does not keep the *reasoning*: which stat beat
 * which, whether the triangle was involved, which signature moves fired. All
 * of that is a pure function of the two cards, the two stats, the event and
 * the health going in, so it is recomputed here rather than stored six ways.
 *
 * Health going in is taken from the previous round's `hpAfter` rather than
 * worked backwards from this one — heals clamp at the starting value, so
 * subtracting them again would be wrong on exactly the rounds that matter.
 *
 * The authoritative numbers still come from the row. If they ever disagreed
 * with the recomputation, the row would be right and this would be a bug —
 * so it is worth knowing they never have to.
 */
function buildReveal(
  duel: DuelWithDuelists,
  turns: readonly DuelTurn[],
  round: number
): Reveal | null {
  const played = turns.filter((t) => t.round === round && t.dealt !== null);
  if (played.length !== 2) return null;

  const a = played.find((t) => t.seat === 0);
  const b = played.find((t) => t.seat === 1);
  if (!a || !b) return null;

  const cardA = cardOf(duel, a.cardId);
  const cardB = cardOf(duel, b.cardId);

  const hpBefore = (seat: number) =>
    turns.find((t) => t.seat === seat && t.round === round - 1)?.hpAfter ?? duel.startHp;

  let detail: ReturnType<typeof resolveClash> | null = null;
  if (cardA && cardB) {
    try {
      detail = resolveClash({
        game: gameOf(duel),
        a: { card: cardA, stat: a.stat, hp: hpBefore(0), startHp: duel.startHp },
        b: { card: cardB, stat: b.stat, hp: hpBefore(1), startHp: duel.startHp },
        event: eventForRound(duel, round),
      });
    } catch {
      detail = null;
    }
  }

  const play = (t: DuelTurn, side: "a" | "b"): ClashPlay => {
    const d = detail?.[side];
    return {
      duelistId: t.duelistId,
      seat: t.seat,
      cardId: t.cardId,
      stat: t.stat,
      attack: d?.attack ?? 0,
      defense: d?.defense ?? 0,
      affinity: d?.affinity ?? 0,
      notes: d?.notes ?? [],
      // Stored, not recomputed: the row is what happened.
      dealt: t.dealt ?? 0,
      taken: t.taken ?? 0,
      healed: t.healed ?? 0,
      hpAfter: t.hpAfter ?? 0,
      timedOut: t.timedOut,
    };
  };

  const plays = [play(a, "a"), play(b, "b")];
  const [x, y] = plays;

  return {
    round,
    eventId: plannedEvents(duel)[round - 1] ?? null,
    plays,
    roundWinner: x.dealt === y.dealt ? null : x.dealt > y.dealt ? x.duelistId : y.duelistId,
  };
}

function lastResolvedRound(turns: readonly DuelTurn[]): number {
  let last = 0;
  for (const t of turns) if (t.dealt !== null && t.round > last) last = t.round;
  return last;
}

/* ------------------------------- upkeep ---------------------------------- */

/**
 * Drops duels that are past their expiry. Called opportunistically on duel
 * creation — a handful of deletes on an already-slow path beats a cron job
 * for something this small. Duelists and turns go with them via cascade.
 */
export async function sweepExpiredDuels(): Promise<void> {
  try {
    await prisma.duel.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch {
    /* housekeeping is never worth failing a request over */
  }
}
