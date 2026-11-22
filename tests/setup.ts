import { beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const testDbPath = path.resolve(process.cwd(), "prisma", "test.db");

process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, "/")}`;
process.env.AUTH_SESSION_SECRET = "test-session-secret-for-vitest-only-32chars";
process.env.LOGIN_MAX_ATTEMPTS = "3";
process.env.LOGIN_LOCKOUT_MINUTES = "5";

beforeAll(() => {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const p = `${testDbPath}${suffix}`;
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env },
  });
});

afterAll(async () => {
  const { getPrisma } = await import("@/lib/prisma");
  await getPrisma().$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const p = `${testDbPath}${suffix}`;
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        // Ignore Windows file lock if still releasing
      }
    }
  }
});
