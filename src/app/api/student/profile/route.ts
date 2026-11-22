import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { studentProfileUpdateSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function PATCH(request: Request) {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = studentProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data profil tidak valid." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      fullName: parsed.data.fullName,
      gradeLevel:
        auth.user.roleCode === "STUDENT" ? parsed.data.gradeLevel : null,
    },
    include: { role: true },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "PROFILE_UPDATED",
    targetType: "USER",
    targetId: auth.user.id,
    metadata: {
      fullName: updated.fullName,
      gradeLevel: updated.gradeLevel,
    },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    message: "Profil berhasil diperbarui.",
    user: {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      gradeLevel: updated.gradeLevel,
      status: updated.status,
      roleCode: updated.role.code,
      roleName: updated.role.name,
    },
  });
}
