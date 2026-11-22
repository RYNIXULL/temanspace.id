import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const [
    pendingStudents,
    approvedStudents,
    rejectedStudents,
    suspendedStudents,
    categoriesCount,
    materialsCount,
    quizzesCount,
    scenariosCount,
    helpCount,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "pending" },
    }),
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "approved" },
    }),
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "rejected" },
    }),
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "suspended" },
    }),
    prisma.materialCategory.count(),
    prisma.material.count(),
    prisma.quiz.count({ where: { type: "QUIZ" } }),
    prisma.quiz.count({ where: { type: "SCENARIO" } }),
    prisma.helpResource.count(),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      pendingStudents,
      approvedStudents,
      rejectedStudents,
      suspendedStudents,
      categoriesCount,
      materialsCount,
      quizzesCount,
      scenariosCount,
      helpCount,
    },
    recentLogs,
  });
}
