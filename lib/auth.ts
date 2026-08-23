/**
 * Admin gate — one shared password, no user accounts.
 *
 * The cookie never holds the password itself: it holds SHA-256 of the password
 * plus a fixed salt, so a leaked cookie doesn't hand over a reusable secret in
 * plaintext. Web Crypto is available in both the edge middleware and node
 * route handlers, so the same helper works on either side.
 */

export const ADMIN_COOKIE = "rg_admin";
const SALT = "recovery-gauntlet/v1";

export async function adminToken(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${SALT}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent compare that doesn't leak position via early exit. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export async function isValidAdminCookie(cookieValue: string | undefined): Promise<boolean> {
  const password = adminPassword();
  if (!password || !cookieValue) return false;
  return safeEqual(cookieValue, await adminToken(password));
}
