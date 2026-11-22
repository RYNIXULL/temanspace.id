import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

function generateReferenceCode(): string {
  const token = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TS-${token}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Format permintaan tidak valid." },
        { status: 400 }
      );
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message || "Data pendaftaran belum lengkap atau tidak valid.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, gradeLevel, password, reasonNote } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Gunakan email lain atau masuk ke akunmu." },
        { status: 409 }
      );
    }

    const studentRole = await prisma.role.findUnique({
      where: { code: "STUDENT" },
    });
    if (!studentRole) {
      return NextResponse.json(
        { error: "Konfigurasi peran siswa belum tersedia di sistem." },
        { status: 500 }
      );
    }

    const passwordHash = await hashPassword(password);

    let referenceCode = generateReferenceCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.registrationRequest.findUnique({
        where: { referenceCode },
        select: { id: true },
      });
      if (!exists) break;
      referenceCode = generateReferenceCode();
    }

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          roleId: studentRole.id,
          fullName,
          email,
          gradeLevel,
          passwordHash,
          status: "pending",
        },
      });

      await tx.registrationRequest.create({
        data: {
          userId: user.id,
          referenceCode,
          reasonNote: reasonNote || null,
          status: "pending",
        },
      });

      return user;
    });

    await recordAuditLog({
      actorUserId: createdUser.id,
      action: "STUDENT_REGISTERED",
      targetType: "USER",
      targetId: createdUser.id,
      metadata: {
        email,
        gradeLevel,
        referenceCode,
        initialStatus: "pending",
      },
      ipAddress: extractClientIp(request.headers),
    });

    return NextResponse.json(
      {
        message:
          "Pendaftaran berhasil dikirim. Akunmu berstatus pending dan menunggu persetujuan admin sebelum dapat login.",
        referenceCode,
        status: "pending",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pendaftaran." },
      { status: 500 }
    );
  }
}
