import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/prisma";
import { PLAYER_TOKEN_HEADER } from "./protocol";

/**
 * Small shared plumbing for /api/games/*. Every route here answers the same
 * three questions first: is there a database, who is asking, and what did they
 * send — so they may as well ask them the same way.
 */

export const NO_STORE = { "cache-control": "no-store" } as const;

export function fail(error: string, status: number, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status, headers: NO_STORE });
}

export function ok<T extends object>(body: T) {
  return NextResponse.json(body, { headers: NO_STORE });
}

/**
 * The games section is the one part of the site that hard-requires Postgres —
 * a room is shared state by definition, so there is no local fallback the way
 * the gauntlet has one.
 */
export function requireDatabase() {
  if (hasDatabase) return null;
  return fail(
    "no_database",
    503,
    "The games rooms need a database. Attach Postgres in Vercel and redeploy."
  );
}

/** The caller's player token, from the header or the JSON body. */
export function tokenFrom(req: Request, body?: Record<string, unknown>): string | null {
  const header = req.headers.get(PLAYER_TOKEN_HEADER);
  if (header && header.trim()) return header.trim().slice(0, 200);
  const inBody = body?.token;
  if (typeof inBody === "string" && inBody.trim()) return inBody.trim().slice(0, 200);
  return null;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
