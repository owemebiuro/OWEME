import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function hasPrismaDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export const prisma =
  process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : (globalForPrisma.prisma ??= new PrismaClient());
