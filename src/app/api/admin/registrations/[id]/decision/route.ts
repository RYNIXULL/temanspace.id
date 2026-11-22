import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { registrationDecisionSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = registrationDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ||
          "Format keputusan pendaftaran tidak valid.",
      },
      { status: 400 }
    );
  }

  const existing = await prisma.registrationRequest.findUnique({
    where: { id },
    include: {
      user: {
        include: { role: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Permohonan pendaftaran tidak ditemukan." },
      { status: 404 }
    );
  }

  if (existing.user.role.code !== "STUDENT") {
    return NextResponse.json(
      { error: "Hanya akun siswa yang dapat diproses melalui persetujuan pendaftaran." },
      { status: 400 }
    );
  }

  const { decision, reviewNote } = parsed.data;
  const nextStatus = decision === "approve" ? "approved" : "rejected";
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const reqRecord = await tx.registrationRequest.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        reviewedById: auth.user.id,
        reviewNote: reviewNote || null,
        reviewedAt: now,
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: {
        status: nextStatus,
      },
    });

    return reqRecord;
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action:
      decision === "approve" ? "APPROVE_REGISTRATION" : "REJECT_REGISTRATION",
    targetType: "REGISTRATION_REQUEST",
    targetId: existing.id,
    metadata: {
      studentUserId: existing.userId,
      studentEmail: existing.user.email,
      referenceCode: existing.referenceCode,
      decision: nextStatus,
      reviewNote: reviewNote || null,
      reviewedAt: now.toISOString(),
      reviewedByEmail: auth.user.email,
    },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    message:
      decision === "approve"
        ? "Pendaftaran siswa disetujui. Siswa kini dapat login."
        : "Pendaftaran siswa ditolak.",
    registration: updated,
  });
}
