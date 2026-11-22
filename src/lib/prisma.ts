import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

function resolveDatabaseUrl(rawUrl?: string): string {
  const url = rawUrl?.trim() || "file:./prisma/dev.db";
  if (url.startsWith("file:./") || url.startsWith("file:../")) {
    const relativePath = url.slice("file:".length);
    const absolutePath = path.resolve(
      /*turbopackIgnore: true*/ process.cwd(),
      relativePath
    );
    return `file:${absolutePath.replace(/\\/g, "/")}`;
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  const resolvedUrl = resolveDatabaseUrl(databaseUrl ?? process.env.DATABASE_URL);
  const adapter = new PrismaLibSql({ url: resolvedUrl });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  const resolvedUrl = resolveDatabaseUrl(process.env.DATABASE_URL);
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== resolvedUrl) {
    globalForPrisma.prisma = createPrismaClient(resolvedUrl);
    globalForPrisma.prismaUrl = resolvedUrl;
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
