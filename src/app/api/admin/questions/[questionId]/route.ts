import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { quizQuestionSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { questionId } = await context.params;
  const existing = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Pertanyaan tidak ditemukan." },
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

  const updated = await prisma.$transaction(async (tx) => {
    await tx.quizOption.deleteMany({ where: { questionId } });
    return tx.quizQuestion.update({
      where: { id: questionId },
      data: {
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
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "UPDATE_QUIZ_QUESTION",
    targetType: "QUIZ_QUESTION",
    targetId: questionId,
    metadata: { quizId: existing.quizId, optionCount: updated.options.length },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ question: updated });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { questionId } = await context.params;
  const existing = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Pertanyaan tidak ditemukan." },
      { status: 404 }
    );
  }

  await prisma.quizQuestion.delete({ where: { id: questionId } });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "DELETE_QUIZ_QUESTION",
    targetType: "QUIZ_QUESTION",
    targetId: questionId,
    metadata: { quizId: existing.quizId },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Pertanyaan berhasil dihapus." });
}
