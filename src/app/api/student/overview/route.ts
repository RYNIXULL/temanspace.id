import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const [categories, totalMaterials, completedCount, quizzes, attempts, helpCount] =
    await Promise.all([
      prisma.materialCategory.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          materials: {
            where: { isPublished: true },
            select: { id: true, slug: true, title: true, readingMinutes: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      prisma.material.count({ where: { isPublished: true } }),
      prisma.materialProgress.count({ where: { userId: auth.user.id } }),
      prisma.quiz.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, type: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: auth.user.id },
        orderBy: { completedAt: "desc" },
        include: {
          quiz: { select: { id: true, title: true, type: true } },
        },
      }),
      prisma.helpResource.count({ where: { isPublished: true } }),
    ]);

  return NextResponse.json({
    user: auth.user,
    stats: {
      totalCategories: categories.length,
      totalMaterials,
      completedMaterials: completedCount,
      totalQuizzes: quizzes.filter((q) => q.type === "QUIZ").length,
      totalScenarios: quizzes.filter((q) => q.type === "SCENARIO").length,
      completedAttempts: attempts.length,
      helpResourcesCount: helpCount,
    },
    categories,
    recentAttempts: attempts.slice(0, 5),
  });
}
