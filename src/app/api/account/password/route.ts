import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordChangeSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ||
          "Data perubahan kata sandi tidak valid.",
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Akun tidak ditemukan." },
      { status: 404 }
    );
  }

  const matches = await verifyPassword(
    user.passwordHash,
    parsed.data.currentPassword
  );
  if (!matches) {
    return NextResponse.json(
      { error: "Kata sandi saat ini tidak sesuai." },
      { status: 400 }
    );
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await recordAuditLog({
    actorUserId: user.id,
    action: "PASSWORD_CHANGED",
    targetType: "USER",
    targetId: user.id,
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Kata sandi berhasil diperbarui." });
}
