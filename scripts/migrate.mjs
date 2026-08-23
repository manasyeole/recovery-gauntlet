/**
 * Runs `prisma migrate deploy` at build time, if — and only if — a database
 * is actually attached.
 *
 * Why this exists: the tables have to be created before the first request, but
 * the project is deployed before Postgres is attached. Failing the build in
 * that window would be worse than useless, so a missing database exits 0 and
 * the app falls back to its "no database connected" notice.
 *
 * Once Postgres is attached, the next deploy creates the tables on its own —
 * nobody has to hand a connection string around.
 */
import { execFileSync } from "node:child_process";

/**
 * Providers name this variable differently, and migrations should prefer a
 * NON-pooled connection — DDL through PgBouncer is unreliable. Ordered by
 * preference: unpooled first, pooled as a fallback.
 */
const CANDIDATES = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_DATABASE_URL",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
];

const found = CANDIDATES.find((k) => (process.env[k] ?? "").trim().length > 0);

if (!found) {
  console.log(
    "[migrate] No database env var set — skipping migrations.\n" +
      "[migrate] Attach Postgres in Vercel → Storage, then redeploy to create the tables."
  );
  process.exit(0);
}

console.log(`[migrate] Using ${found} (non-pooled preferred) → prisma migrate deploy`);

try {
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, DATABASE_URL: process.env[found] },
  });
  console.log("[migrate] Schema is up to date.");
} catch (err) {
  console.error("[migrate] FAILED — the app will build but /admin will show an error.");
  console.error(`[migrate] ${err instanceof Error ? err.message : String(err)}`);
  // Deliberately non-fatal: a broken migration shouldn't take the site down.
  process.exit(0);
}
