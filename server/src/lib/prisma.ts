import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  process.stderr.write("[ERROR] DATABASE_URL is not set. Configure it in server/.env or your deployment environment.\n");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export type DatabaseConnectionInfo = {
  host: string;
  port: string;
  database: string;
  schema?: string;
  sslmode?: string;
};

export function getDatabaseConnectionInfo(): DatabaseConnectionInfo | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    const parsed = new URL(connectionString);
    return {
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      schema: parsed.searchParams.get("schema") || undefined,
      sslmode: parsed.searchParams.get("sslmode") || undefined,
    };
  } catch {
    return null;
  }
}

export function logDatabaseConnection(context: string) {
  const info = getDatabaseConnectionInfo();
  if (!info) {
    process.stderr.write(`[ERROR] [${context}] DATABASE_URL is missing or invalid.\n`);
    return;
  }
  process.stdout.write(
    `[DB] [${context}] host=${info.host} port=${info.port} db=${info.database}` +
      `${info.schema ? ` schema=${info.schema}` : ""}` +
      `${info.sslmode ? ` sslmode=${info.sslmode}` : ""}\n`,
  );
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function assertDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  logDatabaseConnection("server-startup");
  await prisma.$queryRaw`SELECT 1`;
}
