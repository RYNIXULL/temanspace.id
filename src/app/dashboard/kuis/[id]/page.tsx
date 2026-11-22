import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { QuizRunner } from "@/components/student/quiz-runner";

export const dynamic = "force-dynamic";

export default async function StudentQuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: {
      isPublished: true,
      OR: [{ id }, { slug: id }],
    },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              label: true,
              optionText: true,
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  return (
    <QuizRunner
      quizId={quiz.id}
      title={quiz.title}
      description={quiz.description}
      type={quiz.type}
      questions={quiz.questions}
    />
  );
}
