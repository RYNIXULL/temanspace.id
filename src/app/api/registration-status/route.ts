import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registrationStatusLookupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registrationStatusLookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Masukkan email dan kode referensi pendaftaran dengan benar.",
        },
        { status: 400 }
      );
    }

    const { email, referenceCode } = parsed.data;

    const req = await prisma.registrationRequest.findFirst({
      where: {
        referenceCode,
        user: { email },
      },
      include: {
        user: {
          select: {
            fullName: true,
            gradeLevel: true,
            status: true,
          },
        },
      },
    });

    if (!req) {
      return NextResponse.json(
        {
          error:
            "Data pendaftaran tidak ditemukan. Periksa kembali email dan kode referensi pendaftaranmu.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      registration: {
        referenceCode: req.referenceCode,
        fullName: req.user.fullName,
        gradeLevel: req.user.gradeLevel,
        requestStatus: req.status,
        accountStatus: req.user.status,
        reviewNote: req.reviewNote,
        reviewedAt: req.reviewedAt,
        createdAt: req.createdAt,
      },
    });
  } catch (err) {
    console.error("Registration status lookup error:", err);
    return NextResponse.json(
      { error: "Gagal memeriksa status pendaftaran." },
      { status: 500 }
    );
  }
}
