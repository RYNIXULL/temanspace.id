import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import {
  attachSessionCookie,
  createSessionToken,
  type RoleCode,
} from "@/lib/session";
import {
  buildRateLimitKey,
  checkLoginRateLimit,
  clearLoginAttempts,
  recordFailedLoginAttempt,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Format permintaan login tidak valid." },
        { status: 400 }
      );
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Email dan kata sandi wajib diisi dengan benar.",
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const ip = extractClientIp(request.headers);
    const rateKey = buildRateLimitKey(email, ip);

    const rateStatus = await checkLoginRateLimit(rateKey);
    if (!rateStatus.allowed) {
      const waitMinutes = Math.max(
        1,
        Math.ceil(rateStatus.retryAfterSeconds / 60)
      );
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${waitMinutes} menit.`,
          code: "RATE_LIMITED",
          retryAfterSeconds: rateStatus.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        registrationRequest: true,
      },
    });

    if (!user) {
      await recordFailedLoginAttempt(rateKey);
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(user.passwordHash, password);
    if (!passwordValid) {
      const updatedRate = await recordFailedLoginAttempt(rateKey);
      if (!updatedRate.allowed) {
        return NextResponse.json(
          {
            error:
              "Terlalu banyak percobaan login gagal. Akun sementara dibatasi beberapa menit.",
            code: "RATE_LIMITED",
            retryAfterSeconds: updatedRate.retryAfterSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    // Password is valid: enforce account status strictly on backend
    if (user.status === "pending") {
      return NextResponse.json(
        {
          error:
            "Akunmu masih berstatus menunggu persetujuan admin. Silakan periksa halaman Status Pendaftaran secara berkala.",
          code: "ACCOUNT_PENDING",
        },
        { status: 403 }
      );
    }

    if (user.status === "rejected") {
      const note = user.registrationRequest?.reviewNote;
      return NextResponse.json(
        {
          error: note
            ? `Pendaftaran akun ini ditolak oleh admin. Catatan: ${note}`
            : "Pendaftaran akun ini ditolak oleh admin dan tidak dapat digunakan untuk masuk.",
          code: "ACCOUNT_REJECTED",
        },
        { status: 403 }
      );
    }

    if (user.status === "suspended") {
      return NextResponse.json(
        {
          error:
            "Akun ini sedang dinonaktifkan (suspended). Hubungi admin atau pengelola layanan untuk informasi pengaktifan kembali.",
          code: "ACCOUNT_SUSPENDED",
        },
        { status: 403 }
      );
    }

    await clearLoginAttempts(rateKey);

    const roleCode: RoleCode = user.role.code === "ADMIN" ? "ADMIN" : "STUDENT";
    const token = await createSessionToken({
      userId: user.id,
      roleCode,
    });

    await recordAuditLog({
      actorUserId: user.id,
      action: "USER_LOGIN",
      targetType: "USER",
      targetId: user.id,
      metadata: { roleCode },
      ipAddress: ip,
    });

    const response = NextResponse.json({
      message: "Login berhasil.",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        gradeLevel: user.gradeLevel,
        status: user.status,
        roleCode,
        roleName: user.role.name,
      },
    });

    return attachSessionCookie(response, token);
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses login." },
      { status: 500 }
    );
  }
}
