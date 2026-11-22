import { prisma } from "@/lib/prisma";

export interface RecordAuditParams {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Persist an immutable administrative/security audit log record.
 */
export async function recordAuditLog({
  actorUserId = null,
  action,
  targetType,
  targetId,
  metadata = {},
  ipAddress = null,
}: RecordAuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      targetType,
      targetId,
      metadata: JSON.stringify(metadata),
      ipAddress: ipAddress ?? null,
    },
  });
}

export function extractClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }
  return headers.get("x-real-ip")?.trim() || null;
}
