import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { quizQuestionSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id: quizId } = await context.params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json(
      { error: "Kuis atau skenario tidak ditemukan." },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = quizQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data pertanyaan tidak valid." },
      { status: 400 }
    );
  }

  const question = await prisma.quizQuestion.create({
    data: {
      quizId,
      prompt: parsed.data.prompt,
      scenarioContext: parsed.data.scenarioContext ?? null,
      sortOrder: parsed.data.sortOrder,
      options: {
        create: parsed.data.options.map((opt, idx) => ({
          label: opt.label,
          optionText: opt.optionText,
          isRecommended: opt.isRecommended,
          feedbackText: opt.feedbackText,
          sortOrder: opt.sortOrder || idx + 1,
        })),
      },
    },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "CREATE_QUIZ_QUESTION",
    targetType: "QUIZ_QUESTION",
    targetId: question.id,
    metadata: { quizId, optionCount: question.options.length },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ question }, { status: 201 });
}
