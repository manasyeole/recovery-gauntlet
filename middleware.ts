import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/auth";

/**
 * Gates /admin and the admin API behind the shared ADMIN_PASSWORD cookie.
 * Anything unauthenticated gets bounced to /admin/login (or a 401 for the API).
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // The login page and the endpoint that issues the cookie must stay open.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const ok = await isValidAdminCookie(req.cookies.get(ADMIN_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const login = req.nextUrl.clone();
  login.pathname = "/admin/login";
  login.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
