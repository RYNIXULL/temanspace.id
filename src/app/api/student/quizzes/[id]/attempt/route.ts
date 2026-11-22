import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { quizAttemptSubmitSchema } from "@/lib/validators";

export async function POST(
  request: Request,
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
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
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

  if (quiz.questions.length === 0) {
    return NextResponse.json(
      { error: "Kuis ini belum memiliki pertanyaan." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = quizAttemptSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ||
          "Format jawaban tidak valid.",
      },
      { status: 400 }
    );
  }

  const answerByQuestion = new Map<string, string>();
  for (const ans of parsed.data.answers) {
    answerByQuestion.set(ans.questionId, ans.selectedOptionId);
  }

  const validatedAnswers: Array<{
    questionId: string;
    selectedOptionId: string;
    isRecommended: boolean;
    feedbackText: string;
    selectedLabel: string;
    selectedText: string;
    recommendedOptionText: string | null;
  }> = [];

  for (const question of quiz.questions) {
    const selectedOptionId = answerByQuestion.get(question.id);
    if (!selectedOptionId) {
      return NextResponse.json(
        { error: "Semua pertanyaan wajib dijawab sebelum mengirim." },
        { status: 400 }
      );
    }

    const chosenOption = question.options.find(
      (opt) => opt.id === selectedOptionId
    );
    if (!chosenOption) {
      return NextResponse.json(
        { error: "Pilihan jawaban tidak sesuai dengan pertanyaan." },
        { status: 400 }
      );
    }

    const recommendedOption = question.options.find((opt) => opt.isRecommended);

    validatedAnswers.push({
      questionId: question.id,
      selectedOptionId: chosenOption.id,
      isRecommended: chosenOption.isRecommended,
      feedbackText: chosenOption.feedbackText,
      selectedLabel: chosenOption.label,
      selectedText: chosenOption.optionText,
      recommendedOptionText: recommendedOption
        ? `${recommendedOption.label}. ${recommendedOption.optionText}`
        : null,
    });
  }

  const recommendedCount = validatedAnswers.filter(
    (a) => a.isRecommended
  ).length;
  const totalQuestions = quiz.questions.length;

  const attempt = await prisma.$transaction(async (tx) => {
    const createdAttempt = await tx.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: auth.user.id,
        recommendedCount,
        totalQuestions,
      },
    });

    await tx.quizAnswer.createMany({
      data: validatedAnswers.map((a) => ({
        attemptId: createdAttempt.id,
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
      })),
    });

    return createdAttempt;
  });

  // Non-diagnostic, encouraging educational reflection message
  const reflectionSummary =
    recommendedCount === totalQuestions
      ? "Keren! Semua pilihanmu menunjukkan pemahaman yang kuat tentang pertemanan sehat, batasan aman, dan komunikasi asertif."
      : recommendedCount >= Math.ceil(totalQuestions / 2)
      ? "Bagus! Sebagian besar pilihanmu sudah mengarah pada langkah pertemanan yang aman dan asertif. Baca penjelasan tiap nomor untuk makin memperdalam pemahamanmu."
      : "Terima kasih sudah mencoba latihan ini! Setiap situasi memberi ruang belajar baru. Simak pembahasan di bawah ini agar kamu makin percaya diri memilih langkah yang aman.";

  return NextResponse.json(
    {
      attempt: {
        id: attempt.id,
        quizId: quiz.id,
        recommendedCount,
        totalQuestions,
        completedAt: attempt.completedAt,
      },
      reflectionSummary,
      disclaimer:
        "Hasil latihan ini bersifat edukatif untuk refleksi belajar, bukan alat diagnosis psikologis atau penilaian pribadi.",
      details: validatedAnswers,
    },
    { status: 201 }
  );
}
