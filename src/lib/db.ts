import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enable WAL mode & busy timeout on SQLite file directly
try {
  const directDb = new Database(dbPath, { timeout: 5000 });
  directDb.pragma("journal_mode = WAL");
  directDb.pragma("busy_timeout = 5000");
  directDb.pragma("synchronous = NORMAL");
  directDb.close();
} catch (err) {
  // Silent fallback if db is locked or being created
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
