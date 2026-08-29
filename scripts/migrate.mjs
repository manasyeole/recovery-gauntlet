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
import { readdirSync } from "node:fs";
import { join } from "node:path";

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

const env = { ...process.env, DATABASE_URL: process.env[found] };

/** Runs a prisma subcommand, returning its combined output either way. */
function prisma(args) {
  return execFileSync("npx", ["prisma", ...args], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    encoding: "utf8",
    env,
  });
}

function outputOf(err) {
  return `${err?.stdout ?? ""}${err?.stderr ?? ""}`;
}

/** The oldest migration — by convention the one that stands for "the schema
 *  as it was before migrations were introduced". */
function baselineMigration() {
  const dir = join(process.cwd(), "prisma", "migrations");
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  return names[0];
}

console.log(`[migrate] Using ${found} (non-pooled preferred) → prisma migrate deploy`);

try {
  console.log(prisma(["migrate", "deploy"]));
  console.log("[migrate] Schema is up to date.");
} catch (err) {
  const output = outputOf(err);

  /**
   * P3005 — the database already has tables but no migration history. That is
   * exactly what a database created with `prisma db push` looks like, which is
   * what the README used to tell you to do. Prisma's own answer is to
   * "baseline": record the initial migration as already applied, without
   * running it, then let the newer ones through.
   *
   * Without this the build stays green (failures here are deliberately
   * non-fatal) and the missing tables only show up as 503s in production.
   */
  if (output.includes("P3005")) {
    const baseline = baselineMigration();
    console.log(
      `[migrate] P3005: tables exist but no migration history.\n` +
        `[migrate] Baselining "${baseline}" as already applied, then retrying.`
    );
    try {
      console.log(prisma(["migrate", "resolve", "--applied", baseline]));
      console.log(prisma(["migrate", "deploy"]));
      console.log("[migrate] Baselined and up to date.");
      process.exit(0);
    } catch (retryErr) {
      console.error("[migrate] Baseline attempt failed too.");
      console.error(outputOf(retryErr) || String(retryErr));
      process.exit(0);
    }
  }

  console.error(
    "[migrate] FAILED — the app will build, but anything needing the database " +
      "(/admin, /games) will error until this is fixed."
  );
  console.error(output || String(err));
  // Deliberately non-fatal: a broken migration shouldn't take the site down.
  process.exit(0);
}
