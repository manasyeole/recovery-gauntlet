import { NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/session — start a run.
 * Returns { sessionId }. If no DB is configured the client falls back to a
 * local-only id, so a 503 here degrades the site rather than breaking it.
 */
export async function POST(req: Request) {
  if (!hasDatabase) {
    return NextResponse.json(
      { error: "no_database", message: "DATABASE_URL is not set." },
      { status: 503 }
    );
  }

  let visitorName: string | null = null;
  try {
    const body = (await req.json()) as { visitorName?: unknown };
    if (typeof body.visitorName === "string" && body.visitorName.trim()) {
      visitorName = body.visitorName.trim().slice(0, 80);
    }
  } catch {
    /* empty body is fine */
  }

  try {
    const session = await prisma.session.create({ data: { visitorName } });
    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("[api/session] create failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 503 });
  }
}
