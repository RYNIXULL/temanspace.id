import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { sanitizeText } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

const adminSettingsSchema = z.object({
  fullName: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(2, "Nama tampilan minimal 2 karakter.").max(80)),
});

export async function PATCH(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = adminSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data tidak valid." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: auth.user.id },
    data: { fullName: parsed.data.fullName },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "UPDATE_ADMIN_SETTINGS",
    targetType: "USER",
    targetId: auth.user.id,
    metadata: { fullName: updated.fullName },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    message: "Pengaturan akun admin diperbarui.",
    user: updated,
  });
}
