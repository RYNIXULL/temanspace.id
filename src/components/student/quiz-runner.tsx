"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export interface QuizQuestionView {
  id: string;
  prompt: string;
  scenarioContext: string | null;
  sortOrder: number;
  options: Array<{
    id: string;
    label: string;
    optionText: string;
  }>;
}

interface AttemptResponse {
  attempt: {
    id: string;
    recommendedCount: number;
    totalQuestions: number;
  };
  reflectionSummary: string;
  disclaimer: string;
  details: Array<{
    questionId: string;
    selectedOptionId: string;
    isRecommended: boolean;
    feedbackText: string;
    selectedLabel: string;
    selectedText: string;
    recommendedOptionText: string | null;
  }>;
}

export function QuizRunner({
  quizId,
  title,
  description,
  type,
  questions,
}: {
  quizId: string;
  title: string;
  description: string;
  type: "QUIZ" | "SCENARIO";
  questions: QuizQuestionView[];
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResponse | null>(null);

  const answeredCount = Object.keys(selected).length;
  const allAnswered =
    questions.length > 0 && answeredCount === questions.length;

  const handleSelect = (questionId: string, optionId: string) => {
    if (result) return;
    setSelected((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) {
      toast.error(
        "Belum Lengkap",
        "Pilih jawaban untuk semua pertanyaan terlebih dahulu."
      );
      return;
    }

    setSubmitting(true);
    try {
      const answers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selected[q.id],
      }));

      const res = await fetch(`/api/student/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Mengirim", data.error || "Terjadi kesalahan.");
        return;
      }

      setResult(data);
      toast.success(
        "Latihan Selesai",
        `${data.attempt.recommendedCount} dari ${data.attempt.totalQuestions} pilihan tepat.`
      );
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelected({});
    setResult(null);
  };

  const detailByQuestion = new Map(
    result?.details.map((d) => [d.questionId, d]) ?? []
  );

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-8 space-y-3">
        <Link
          href="/dashboard/kuis"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Kuis & Skenario</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="clay-badge inline-block px-3 py-1 text-xs mb-2">
              {type === "SCENARIO" ? "Simulasi Skenario" : "Kuis Edukatif"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-3xl">
              {description}
            </p>
          </div>
          <div className="text-xs font-bold px-3.5 py-2 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-sky-700 dark:text-sky-300">
            Terjawab: {answeredCount} / {questions.length}
          </div>
        </div>
      </div>

      {result && (
        <div className="clay-card-blue p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-100">
                Hasil Refleksi Latihan
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                {result.attempt.recommendedCount} dari{" "}
                {result.attempt.totalQuestions} Pilihan Konstruktif
              </h2>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-sky-700 font-bold text-sm hover:bg-sky-50 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Latihan</span>
            </button>
          </div>
          <p className="text-sm sm:text-base text-sky-50 leading-relaxed">
            {result.reflectionSummary}
          </p>
          <div className="rounded-xl bg-white/15 border border-white/30 px-4 py-2.5 text-xs text-sky-50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q, idx) => {
          const picked = selected[q.id];
          const feedback = detailByQuestion.get(q.id);

          return (
            <div key={q.id} className="clay-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="clay-badge px-3 py-1 text-xs">
                  {type === "SCENARIO"
                    ? `Situasi ${idx + 1}`
                    : `Pertanyaan ${idx + 1}`}
                </span>
              </div>

              {q.scenarioContext && (
                <div className="rounded-2xl bg-sky-50/90 dark:bg-slate-800/80 border border-sky-200/80 dark:border-slate-700 p-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300 mb-1">
                    Konteks Situasi
                  </p>
                  <p>{q.scenarioContext}</p>
                </div>
              )}

              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {q.prompt}
              </h3>

              <div className="space-y-2.5">
                {q.options.map((opt) => {
                  const isSelected = picked === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={Boolean(result)}
                      onClick={() => handleSelect(q.id, opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${
                        isSelected
                          ? "border-sky-500 bg-sky-50/90 dark:bg-sky-950/50 shadow-sm"
                          : "border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 hover:border-sky-300"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? "bg-sky-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                        {opt.optionText}
                      </span>
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div
                  className={`rounded-2xl p-4 border text-sm space-y-1.5 ${
                    feedback.isRecommended
                      ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200"
                      : "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700/60 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {feedback.isRecommended ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span>
                      {feedback.isRecommended
                        ? "Pilihan Paling Konstruktif & Aman"
                        : "Penjelasan & Alternatif Lebih Aman"}
                    </span>
                  </div>
                  <p className="leading-relaxed">{feedback.feedbackText}</p>
                  {!feedback.isRecommended && feedback.recommendedOptionText && (
                    <p className="text-xs pt-1 font-semibold">
                      Rekomendasi langkah aman: {feedback.recommendedOptionText}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!result && questions.length > 0 && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !allAnswered}
              className="clay-btn-primary px-6 py-3.5 text-sm sm:text-base inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? "Menyimpan Jawaban..."
                  : "Kirim Jawaban & Lihat Pembahasan"}
              </span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
