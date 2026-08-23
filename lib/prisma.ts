import { PrismaClient } from "@prisma/client";

/** True once a database is actually wired up. Lets /admin fail gracefully. */
export const hasDatabase = Boolean(
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL
);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * A single PrismaClient, reused across hot reloads in dev and across warm
 * serverless invocations in production — one per request would exhaust the
 * Postgres connection pool fast.
 *
 * Instantiation is lazy behind a Proxy: `new PrismaClient()` throws when
 * DATABASE_URL is missing, and this module gets imported while Next collects
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
