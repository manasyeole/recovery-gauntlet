// Server-only: pulls in Prisma and node:crypto by way of ./codes. Never
// import this from a "use client" file — reach for ./protocol instead, which
// is the half both sides are allowed to share.
import type { GameAnswer, GamePlayer, GameRoom } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bankFor, type Question } from "./questions";
import {
  AWAY_MS,
  REVEAL_MS,
  type LiveQuestion,
  type PublicPlayer,
  type Reveal,
  type RoomState,
  type RoomStatus,
} from "./protocol";

export type RoomWithPlayers = GameRoom & { players: GamePlayer[] };

/* ------------------------------ loading -------------------------------- */

export async function findRoom(code: string): Promise<RoomWithPlayers | null> {
  if (!code) return null;
  return prisma.gameRoom.findUnique({
    where: { code },
    include: { players: { orderBy: { joinedAt: "asc" } } },
  });
}

/** The plan drawn at creation time, as question ids. */
export function plannedIds(room: GameRoom): string[] {
  try {
    const parsed: unknown = JSON.parse(room.questionIds);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** The question for a 1-based round number, or undefined past the end. */
export function questionForRound(room: GameRoom, round: number): Question | undefined {
  const ids = plannedIds(room);
  const id = ids[round - 1];
  if (!id) return undefined;
  return bankFor(room.gameSlug).find((q) => q.id === id);
}

/* ------------------------------ the clock ------------------------------- */

/**
 * Moves the room forward if its current phase has run out.
 *
 * There is no scheduler and no socket server: whoever polls next does the
 * work. Every transition is a conditional `updateMany` keyed on the state it
 * expects to find, so six browsers polling in the same millisecond produce
 * exactly one advance — the other five see `count === 0` and just re-read.
 *
 * Loops, because a room that nobody looked at for a minute may owe several
 * transitions at once; capped so a stuck room can never spin here.
 */
export async function tick(roomId: string): Promise<void> {
  for (let guard = 0; guard < 6; guard++) {
    const room = await prisma.gameRoom.findUnique({ where: { id: roomId } });
    if (!room || !room.phaseEndsAt) return;
    if (room.phaseEndsAt.getTime() > Date.now()) return;

    if (room.status === "question") {
      const advanced = await closeQuestion(room);
      if (!advanced) return;
    } else if (room.status === "reveal") {
      const advanced = await openNextQuestion(room);
      if (!advanced) return;
    } else {
      return;
    }
  }
}

/** question → reveal. Returns false if another request got there first. */
async function closeQuestion(room: GameRoom): Promise<boolean> {
  const { count } = await prisma.gameRoom.updateMany({
    where: { id: room.id, status: "question", currentRound: room.currentRound },
    data: { status: "reveal", phaseEndsAt: new Date(Date.now() + REVEAL_MS) },
  });
  if (count === 0) return false;

  // Anyone who let the clock run out loses their streak. Answering already
  // set the streak at answer time, so this only touches the silent ones.
  const answered = await prisma.gameAnswer.findMany({
    where: { roomId: room.id, round: room.currentRound },
    select: { playerId: true },
  });
  await prisma.gamePlayer.updateMany({
    where: { roomId: room.id, id: { notIn: answered.map((a) => a.playerId) }, streak: { gt: 0 } },
    data: { streak: 0 },
  });
  return true;
}

/** reveal → next question, or the end of the game. */
async function openNextQuestion(room: GameRoom): Promise<boolean> {
  const next = room.currentRound + 1;
  const isOver = next > room.totalRounds || !questionForRound(room, next);

  const { count } = await prisma.gameRoom.updateMany({
    where: { id: room.id, status: "reveal", currentRound: room.currentRound },
    data: isOver
      ? { status: "finished", phaseEndsAt: null }
      : {
          status: "question",
          currentRound: next,
          phaseEndsAt: new Date(Date.now() + room.roundSeconds * 1000),
        },
  });
  return count > 0;
}

/**
 * Called after an answer lands: if nobody is left to answer, pull the end of
 * the round forward instead of making everyone watch a dead timer. The next
 * poll then handles the transition through the same path as a natural expiry.
 */
export async function endRoundIfEveryoneAnswered(room: GameRoom): Promise<void> {
  if (room.status !== "question" || !room.phaseEndsAt) return;

  // Players who joined after this question went up aren't expected to answer.
  const roundStarted = new Date(room.phaseEndsAt.getTime() - room.roundSeconds * 1000);
  const [expected, answered] = await Promise.all([
    prisma.gamePlayer.count({ where: { roomId: room.id, joinedAt: { lte: roundStarted } } }),
    prisma.gameAnswer.count({ where: { roomId: room.id, round: room.currentRound } }),
  ]);

  if (expected > 0 && answered >= expected) {
    await prisma.gameRoom.updateMany({
      where: { id: room.id, status: "question", currentRound: room.currentRound },
      data: { phaseEndsAt: new Date() },
    });
  }
}

/* --------------------------- serialisation ------------------------------ */

/**
 * Builds the payload one specific browser is allowed to see.
 *
 * The important rule: while a question is live, the correct index never leaves
 * the server. Nothing stops a player reading the network tab, so the answer
 * simply isn't in it until the round is over.
 */
export async function serializeRoom(
  room: RoomWithPlayers,
  viewerToken: string | null
): Promise<RoomState> {
  const status = room.status as RoomStatus;
  const now = Date.now();
  const msLeft = room.phaseEndsAt ? Math.max(0, room.phaseEndsAt.getTime() - now) : 0;

  const me = viewerToken ? room.players.find((p) => p.token === viewerToken) ?? null : null;

  const roundAnswers: GameAnswer[] =
    status === "question" || status === "reveal"
      ? await prisma.gameAnswer.findMany({
          where: { roomId: room.id, round: room.currentRound },
        })
      : [];

  const answeredIds = new Set(roundAnswers.map((a) => a.playerId));

  const players: PublicPlayer[] = [...room.players]
    .sort((a, b) => b.score - a.score || a.joinedAt.getTime() - b.joinedAt.getTime())
    .map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      score: p.score,
      streak: p.streak,
      isHost: p.isHost,
      online: now - p.lastSeenAt.getTime() < AWAY_MS,
      answered: answeredIds.has(p.id),
      isYou: me?.id === p.id,
    }));

  const q = status === "question" || status === "reveal" ? questionForRound(room, room.currentRound) : undefined;

  const question: LiveQuestion | null = q
    ? { round: room.currentRound, prompt: q.prompt, choices: [...q.choices] }
    : null;

  let reveal: Reveal | null = null;
  if (status === "reveal" && q) {
    const picks: Record<string, number> = {};
    const gained: Record<string, number> = {};
    for (const p of room.players) {
      const a = roundAnswers.find((x) => x.playerId === p.id);
      picks[p.id] = a ? a.choice : -1;
      gained[p.id] = a ? a.points : 0;
    }
    reveal = { correctIndex: q.answer, fact: q.fact, picks, gained };
  }

  return {
    code: room.code,
    gameSlug: room.gameSlug,
    status,
    round: room.currentRound,
    totalRounds: room.totalRounds,
    roundSeconds: room.roundSeconds,
    msLeft,
    players,
    viewer: me
      ? {
          id: me.id,
          name: me.name,
          isHost: me.isHost,
          pick: roundAnswers.find((a) => a.playerId === me.id)?.choice ?? null,
        }
      : null,
    question,
    reveal,
  };
}

/* ------------------------------ upkeep ---------------------------------- */

/**
 * Drops rooms that are past their expiry. Called opportunistically on room
 * creation — a handful of deletes on an already-slow path beats a cron job
 * for something this small. Players and answers go with them via cascade.
 */
export async function sweepExpiredRooms(): Promise<void> {
  try {
    await prisma.gameRoom.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch {
    /* housekeeping is never worth failing a request over */
  }
}
