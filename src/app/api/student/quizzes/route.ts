import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const [quizzes, attempts] = await Promise.all([
    prisma.quiz.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        _count: { select: { questions: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: auth.user.id },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const latestAttemptByQuiz = new Map<string, (typeof attempts)[number]>();
  for (const att of attempts) {
    if (!latestAttemptByQuiz.has(att.quizId)) {
      latestAttemptByQuiz.set(att.quizId, att);
    }
  }

  return NextResponse.json({
    quizzes: quizzes.map((q) => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      description: q.description,
      type: q.type,
      category: q.category,
      questionCount: q._count.questions,
      latestAttempt: latestAttemptByQuiz.get(q.id) ?? null,
    })),
  });
}
