import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const quiz = await prisma.quiz.findFirst({
    where: {
      isPublished: true,
      OR: [{ id }, { slug: id }],
    },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              label: true,
              optionText: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json(
      { error: "Kuis atau skenario tidak ditemukan." },
      { status: 404 }
    );
  }

  const pastAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, userId: auth.user.id },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  return NextResponse.json({ quiz, pastAttempts });
}
