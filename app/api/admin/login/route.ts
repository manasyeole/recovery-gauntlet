import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword, adminToken, safeEqual } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { password } → sets the admin cookie for 30 days. */
export async function POST(req: Request) {
  const expected = adminPassword();
  if (!expected) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: "ADMIN_PASSWORD is not set on this deployment.",
      },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    /* handled below */
  }

  if (!password || !safeEqual(password, expected)) {
    // Small delay so this isn't a fast oracle for guessing.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: await adminToken(expected),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

/** DELETE — log out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: ADMIN_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
