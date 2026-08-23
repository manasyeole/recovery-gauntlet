import { PrismaClient } from "@prisma/client";

/**
 * Providers inject the Postgres connection string under different names —
 * Vercel's Neon integration sets DATABASE_URL plus POSTGRES_* aliases,
 * Supabase gives you POSTGRES_URL, and a hand-rolled setup might only have
 * one of them. Resolving here (rather than hard-coding env("DATABASE_URL") as
 * the only option) means attaching any Postgres just works.
 *
 * Pooled URLs are preferred for the app — serverless opens a lot of
 * short-lived connections. Migrations want the opposite; see scripts/migrate.mjs.
 */
const URL_CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

export function resolveDatabaseUrl(): string | undefined {
  for (const key of URL_CANDIDATES) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

/** True once a database is actually wired up. Lets /admin fail gracefully. */
export const hasDatabase = Boolean(resolveDatabaseUrl());

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * A single PrismaClient, reused across hot reloads in dev and across warm
 * serverless invocations in production — one per request would exhaust the
 * Postgres connection pool fast.
 *
 * Instantiation is lazy behind a Proxy: `new PrismaClient()` throws when no
 * connection string is set, and this module gets imported while Next collects
 * page data at build time. Deferring it means the app still builds (and
 * /admin still renders its "no database" notice) before Postgres is attached.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = (globalForPrisma.prisma ??= createClient());
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
