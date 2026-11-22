import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  MessageSquareHeart,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [quizzes, attempts] = await Promise.all([
    prisma.quiz.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: {
        category: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const latestMap = new Map<string, (typeof attempts)[number]>();
  for (const att of attempts) {
    if (!latestMap.has(att.quizId)) {
      latestMap.set(att.quizId, att);
    }
  }

  const quizItems = quizzes.filter((q) => q.type === "QUIZ");
  const scenarioItems = quizzes.filter((q) => q.type === "SCENARIO");

  const renderCard = (q: (typeof quizzes)[number]) => {
    const latest = latestMap.get(q.id);
    const isScenario = q.type === "SCENARIO";

    return (
      <div
        key={q.id}
        className="clay-card clay-card-hover p-6 flex flex-col justify-between gap-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="clay-badge inline-flex items-center gap-1.5 px-3 py-1 text-xs">
              {isScenario ? (
                <MessageSquareHeart className="w-3.5 h-3.5" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5" />
              )}
              <span>{isScenario ? "Simulasi Skenario" : "Kuis Edukatif"}</span>
            </span>

            {latest ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {latest.recommendedCount}/{latest.totalQuestions} Tepat
                </span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {q._count.questions} Pertanyaan
              </span>
            )}
          </div>

          <div>
            {q.category && (
              <p className="text-[11px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                {q.category.name}
              </p>
            )}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {q.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              {q.description}
            </p>
          </div>
        </div>

        <Link
          href={`/dashboard/kuis/${q.id}`}
          className="clay-btn-primary px-4 py-2.5 text-sm inline-flex items-center justify-center gap-2"
        >
          <span>{latest ? "Coba Latihan Lagi" : "Mulai Sekarang"}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-7">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Kuis & Skenario Interaktif
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl">
            Latih penerapan materi pertemanan sehat pada situasi sehari-hari di
            SMP. Setiap jawaban dilengkapi pembahasan edukatif untuk refleksi
            bersama.
          </p>
        </div>
        <div className="rounded-2xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shrink-0 max-w-xs">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>Bersifat edukatif & non-diagnostik.</span>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Simulasi Skenario Pertemanan
        </h2>
        {scenarioItems.length === 0 ? (
          <div className="clay-card p-6 text-sm text-slate-500">
            Belum ada skenario yang diterbitkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scenarioItems.map(renderCard)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Kuis Pemahaman Materi
        </h2>
        {quizItems.length === 0 ? (
          <div className="clay-card p-6 text-sm text-slate-500">
            Belum ada kuis yang diterbitkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quizItems.map(renderCard)}
          </div>
        )}
      </section>
    </div>
  );
}
