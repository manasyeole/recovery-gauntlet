import { NextResponse } from "next/server";
import { hasDatabase, prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sessions — JSON dump of every run, newest first.
 * Gated by middleware. Handy for archiving the group chat's finest hour.
 *
 * ?q=name  filter by visitor name
 * ?since=YYYY-MM-DD
 */
export async function GET(req: Request) {
  if (!hasDatabase) {
    return NextResponse.json({ error: "no_database" }, { status: 503 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const since = url.searchParams.get("since")?.trim();

  const sinceDate = since ? new Date(`${since}T00:00:00`) : null;
  const validSince = sinceDate && !Number.isNaN(sinceDate.getTime()) ? sinceDate : null;

  try {
    const sessions = await prisma.session.findMany({
      where: {
        ...(q ? { visitorName: { contains: q, mode: "insensitive" as const } } : {}),
        ...(validSince ? { createdAt: { gte: validSince } } : {}),
      },
      include: { answers: { orderBy: { stepNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ count: sessions.length, sessions });
  } catch (err) {
    console.error("[api/admin/sessions] query failed", err);
    return NextResponse.json({ error: "db_error" }, { status: 503 });
  }
}
