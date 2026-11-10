import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { buildMariaDbPoolConfig } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function loadStandaloneEnv(): void {
  if (process.env.DATABASE_URL || process.env.NEXT_RUNTIME) return;
  try {
    process.loadEnvFile(".env.local");
  } catch {
    return;
  }
}

function createClient(): PrismaClient {
  loadStandaloneEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diatur. Salin .env.example ke .env.local lalu isi DATABASE_URL. Lihat DEPLOYMENT.md untuk contoh format MySQL.",
    );
  }
  let adapter: PrismaMariaDb;
  try {
    adapter = new PrismaMariaDb(buildMariaDbPoolConfig(url));
  } catch {
    adapter = new PrismaMariaDb(url);
  }
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}