import { prisma } from "@/lib/prisma";

function getMaxAttempts(): number {
  const parsed = Number(process.env.LOGIN_MAX_ATTEMPTS ?? "5");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function getLockoutMs(): number {
  const minutes = Number(process.env.LOGIN_LOCKOUT_MINUTES ?? "15");
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 15;
  return safeMinutes * 60 * 1000;
}

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

export function buildRateLimitKey(email: string, ip: string | null): string {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ip?.trim() || "unknown";
  return `login:${normalizedEmail}:${normalizedIp}`;
}

export async function checkLoginRateLimit(
  identifier: string
): Promise<RateLimitStatus> {
  const maxAttempts = getMaxAttempts();
  const record = await prisma.loginAttempt.findUnique({
    where: { identifier },
  });

  if (!record) {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  const now = new Date();
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil(
      (record.lockedUntil.getTime() - now.getTime()) / 1000
    );
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // If lockout expired, reset counter cleanly
  if (record.lockedUntil && record.lockedUntil <= now) {
    await prisma.loginAttempt.update({
      where: { identifier },
      data: { attempts: 0, lockedUntil: null },
    });
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - record.attempts),
    retryAfterSeconds: 0,
  };
}

export async function recordFailedLoginAttempt(
  identifier: string
): Promise<RateLimitStatus> {
  const maxAttempts = getMaxAttempts();
  const lockoutMs = getLockoutMs();
  const existing = await prisma.loginAttempt.findUnique({
    where: { identifier },
  });

  const nextAttempts = (existing?.attempts ?? 0) + 1;
  const shouldLock = nextAttempts >= maxAttempts;
  const lockedUntil = shouldLock ? new Date(Date.now() + lockoutMs) : null;

  await prisma.loginAttempt.upsert({
    where: { identifier },
    create: {
      identifier,
      attempts: nextAttempts,
      lockedUntil,
    },
    update: {
      attempts: nextAttempts,
      lockedUntil,
    },
  });

  if (shouldLock && lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(lockoutMs / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - nextAttempts),
    retryAfterSeconds: 0,
  };
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: { identifier },
  });
}
