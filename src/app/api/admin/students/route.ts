import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status")?.trim();
  const validStatus =
    statusParam === "pending" ||
    statusParam === "approved" ||
    statusParam === "rejected" ||
    statusParam === "suspended"
      ? statusParam
      : undefined;

  const students = await prisma.user.findMany({
    where: {
      role: { code: "STUDENT" },
      ...(validStatus ? { status: validStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      gradeLevel: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      registrationRequest: {
        select: {
          referenceCode: true,
          reviewedAt: true,
          reviewNote: true,
        },
      },
      _count: {
        select: {
          quizAttempts: true,
          materialProgress: true,
        },
      },
    },
  });

  return NextResponse.json({ students });
}
