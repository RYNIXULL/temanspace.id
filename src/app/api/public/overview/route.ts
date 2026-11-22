import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [categories, materialCount, quizCount, scenarioCount] =
    await Promise.all([
      prisma.materialCategory.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          iconName: true,
          _count: {
            select: {
              materials: { where: { isPublished: true } },
            },
          },
        },
      }),
      prisma.material.count({ where: { isPublished: true } }),
      prisma.quiz.count({ where: { isPublished: true, type: "QUIZ" } }),
      prisma.quiz.count({ where: { isPublished: true, type: "SCENARIO" } }),
    ]);

  return NextResponse.json({
    categories,
    counts: {
      materials: materialCount,
      quizzes: quizCount,
      scenarios: scenarioCount,
    },
  });
}
