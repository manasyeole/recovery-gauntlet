import { NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/prisma";
import { TOTAL_STEPS } from "@/lib/steps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ANSWER = 1000;
const MAX_QUESTION = 500;

interface IncomingAnswer {
  stepNumber: number;
  question: string;
  answer: string;
}

/** Accepts either one answer (the simple shape) or a batch of them. */
function parseBody(body: Record<string, unknown>): {
  sessionId: string;
  visitorName: string | null;
  completed: boolean;
  answers: IncomingAnswer[];
} | null {
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId || sessionId.length > 60) return null;

  const raw = Array.isArray(body.answers)
    ? body.answers
    : [{ stepNumber: body.stepNumber, question: body.question, answer: body.answer }];

  const answers: IncomingAnswer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { stepNumber, question, answer } = item as Record<string, unknown>;
    const n = Number(stepNumber);
    if (!Number.isInteger(n) || n < 1 || n > TOTAL_STEPS) continue;
    if (typeof question !== "string" || typeof answer !== "string") continue;
    answers.push({
      stepNumber: n,
      question: question.slice(0, MAX_QUESTION),
      answer: answer.slice(0, MAX_ANSWER),
    });
  }
  if (answers.length === 0) return null;

  // Later entries win if the same step shows up twice in one batch.
  const byStep = new Map(answers.map((a) => [a.stepNumber, a]));

  const visitorName =
    typeof body.visitorName === "string" && body.visitorName.trim()
      ? body.visitorName.trim().slice(0, 80)
      : null;

  return {
    sessionId,
    visitorName,
    completed: body.completed === true,
    answers: [...byStep.values()],
  };
}

/**
 * POST /api/answer
 * Body: { sessionId, stepNumber, question, answer }
 *    or { sessionId, visitorName?, completed?, answers: [{ stepNumber, question, answer }] }
 *
 * Upserts the Session on first call, then upserts each Answer so a visitor
 * going Back and changing their mind overwrites instead of duplicating.
 */
export async function POST(req: Request) {
  if (!hasDatabase) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { sessionId, visitorName, completed, answers } = parsed;

  // Step 1 is the name question, so treat its answer as the visitor name too.
  const nameFromStepOne = answers.find((a) => a.stepNumber === 1)?.answer.trim();
  const name = (visitorName || nameFromStepOne || "").slice(0, 80) || null;

  try {
    await prisma.$transaction([
      prisma.session.upsert({
        where: { id: sessionId },
        create: { id: sessionId, visitorName: name, completed },
        update: {
          ...(name ? { visitorName: name } : {}),
          ...(completed ? { completed: true } : {}),
        },
      }),
      ...answers.map((a) =>
        prisma.answer.upsert({
          where: { sessionId_stepNumber: { sessionId, stepNumber: a.stepNumber } },
          create: { sessionId, stepNumber: a.stepNumber, question: a.question, answer: a.answer },
          update: { question: a.question, answer: a.answer },
        })
      ),
    ]);

    return NextResponse.json({ ok: true, saved: answers.length });
  } catch (err) {
    console.error("[api/answer] write failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 503 });
  }
}
