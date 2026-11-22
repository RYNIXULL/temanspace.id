import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { adminUserUpdateSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = adminUserUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data siswa tidak valid." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!target || target.role.code !== "STUDENT") {
    return NextResponse.json(
      { error: "Akun siswa tidak ditemukan." },
      { status: 404 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.fullName !== undefined
        ? { fullName: parsed.data.fullName }
        : {}),
      ...(parsed.data.gradeLevel !== undefined
        ? { gradeLevel: parsed.data.gradeLevel }
        : {}),
      ...(parsed.data.status !== undefined
        ? { status: parsed.data.status }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      gradeLevel: true,
      status: true,
      updatedAt: true,
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "UPDATE_STUDENT_ACCOUNT",
    targetType: "USER",
    targetId: id,
    metadata: {
      previousStatus: target.status,
      nextStatus: updated.status,
      updatedFields: parsed.data,
    },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    message: "Data akun siswa berhasil diperbarui.",
    student: updated,
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const target = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!target || target.role.code !== "STUDENT") {
    return NextResponse.json(
      { error: "Akun siswa tidak ditemukan." },
      { status: 404 }
    );
  }

  await prisma.user.delete({ where: { id } });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "DELETE_STUDENT_ACCOUNT",
    targetType: "USER",
    targetId: id,
    metadata: { email: target.email, fullName: target.fullName },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Akun siswa berhasil dihapus." });
}
