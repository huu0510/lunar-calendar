import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Development uses SQLite through the better-sqlite3 adapter.
 * For PostgreSQL, change the datasource provider and construct `PrismaPg`
 * instead — see the README. One generated client matches one provider.
 */
function databaseUrl(): string {
  return process.env.DATABASE_URL || "file:./prisma/dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const url = databaseUrl();
  if (url.startsWith("postgres")) {
    throw new Error(
      "DATABASE_URL trỏ tới PostgreSQL nhưng schema hiện tại là SQLite. Xem README để chuyển production.",
    );
  }
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
