"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Edit3, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface OptionItem {
  id?: string;
  label: string;
  optionText: string;
  isRecommended: boolean;
  feedbackText: string;
  sortOrder: number;
}

interface QuestionItem {
  id: string;
  prompt: string;
  scenarioContext: string | null;
  sortOrder: number;
  options: OptionItem[];
}

interface QuizDetail {
  id: string;
  title: string;
  type: "QUIZ" | "SCENARIO";
  questions: QuestionItem[];
}

const DEFAULT_OPTIONS = (): OptionItem[] => [
  {
    label: "A",
    optionText: "",
    isRecommended: true,
    feedbackText: "",
    sortOrder: 1,
  },
  {
    label: "B",
    optionText: "",
    isRecommended: false,
    feedbackText: "",
    sortOrder: 2,
  },
  {
    label: "C",
    optionText: "",
    isRecommended: false,
    feedbackText: "",
    sortOrder: 3,
  },
];

export function QuestionsManager({ quizId }: { quizId: string }) {
  const toast = useToast();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuestionItem | null>(null);

  const [prompt, setPrompt] = useState("");
  const [scenarioContext, setScenarioContext] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [options, setOptions] = useState<OptionItem[]>(DEFAULT_OPTIONS);
  const [saving, setSaving] = useState(false);

  const loadQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`);
      const data = await res.json();
      if (res.ok) setQuiz(data.quiz);
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat memuat pertanyaan.");
    } finally {
      setLoading(false);
    }
  }, [quizId, toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}`);
        const data = await res.json();
        if (active && res.ok) setQuiz(data.quiz);
      } catch {
        if (active) toast.error("Gagal Memuat", "Tidak dapat memuat pertanyaan.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [quizId, toast]);

  const openCreate = () => {
    setEditing(null);
    setPrompt("");
    setScenarioContext("");
    setSortOrder((quiz?.questions.length ?? 0) + 1);
    setOptions(DEFAULT_OPTIONS());
    setFormOpen(true);
  };

  const openEdit = (q: QuestionItem) => {
    setEditing(q);
    setPrompt(q.prompt);
    setScenarioContext(q.scenarioContext || "");
    setSortOrder(q.sortOrder);
    setOptions(
      q.options.map((o, idx) => ({
        label: o.label,
        optionText: o.optionText,
        isRecommended: o.isRecommended,
        feedbackText: o.feedbackText,
        sortOrder: o.sortOrder || idx + 1,
      }))
    );
    setFormOpen(true);
  };

  const updateOption = (idx: number, patch: Partial<OptionItem>) => {
    setOptions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const addOptionSlot = () => {
    if (options.length >= 6) return;
    const labels = ["A", "B", "C", "D", "E", "F"];
    setOptions((prev) => [
      ...prev,
      {
        label: labels[prev.length] || `${prev.length + 1}`,
        optionText: "",
        isRecommended: false,
        feedbackText: "",
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const removeOptionSlot = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/questions/${editing.id}`
        : `/api/admin/quizzes/${quizId}/questions`;
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          scenarioContext: scenarioContext.trim() || null,
          sortOrder: Number(sortOrder),
          options: options.map((o, idx) => ({
            ...o,
            sortOrder: idx + 1,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Periksa pertanyaan & opsi.");
        return;
      }

      toast.success(
        editing ? "Pertanyaan Diperbarui" : "Pertanyaan Ditambahkan",
        "Pertanyaan dan pilihan jawaban berhasil disimpan."
      );
      setFormOpen(false);
      await loadQuiz();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan pertanyaan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menghapus", data.error);
        return;
      }
      toast.success("Pertanyaan Dihapus", data.message);
      setDeleteTarget(null);
      await loadQuiz();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghapus pertanyaan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={quiz?.type === "SCENARIO" ? "/admin/skenario" : "/admin/kuis"}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Pertanyaan & Pilihan Jawaban
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            {quiz ? quiz.title : "Memuat..."}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="clay-btn-primary px-4 py-2.5 text-sm inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pertanyaan</span>
        </button>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat pertanyaan...
        </div>
      ) : !quiz || quiz.questions.length === 0 ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Belum ada pertanyaan. Klik &ldquo;Tambah Pertanyaan&rdquo; untuk memulai.
        </div>
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} className="clay-card p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="clay-badge px-3 py-1 text-xs">
                  Nomor {idx + 1} (Urutan {q.sortOrder})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(q)}
                    className="clay-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(q)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {q.scenarioContext && (
                <p className="text-xs sm:text-sm bg-sky-50 dark:bg-slate-800/80 rounded-xl p-3 text-slate-700 dark:text-slate-200">
                  <strong>Konteks:</strong> {q.scenarioContext}
                </p>
              )}
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {q.prompt}
              </h2>

              <div className="space-y-2 pt-1">
                {q.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`rounded-xl p-3 border text-xs sm:text-sm ${
                      opt.isRecommended
                        ? "bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span>{opt.label}.</span>
                      <span>{opt.optionText}</span>
                      {opt.isRecommended && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 ml-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pilihan Tepat</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Pembahasan: {opt.feedbackText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Ubah Pertanyaan & Pilihan" : "Tambah Pertanyaan Baru"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {quiz?.type === "SCENARIO" && (
            <div>
              <label className="block text-sm font-bold mb-1">
                Konteks Cerita Skenario (Opsional)
              </label>
              <textarea
                rows={3}
                value={scenarioContext}
                onChange={(e) => setScenarioContext(e.target.value)}
                placeholder="Ceritakan situasi pertemanan di sekolah..."
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-sm font-bold mb-1">Pertanyaan</label>
              <input
                type="text"
                required
                minLength={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Urutan</label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Pilihan Jawaban & Pembahasan</p>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOptionSlot}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  + Tambah Opsi
                </button>
              )}
            </div>

            {options.map((opt, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={opt.label}
                      onChange={(e) =>
                        updateOption(idx, { label: e.target.value.toUpperCase() })
                      }
                      className="clay-inset w-12 px-2 py-1 text-center text-xs font-bold"
                    />
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={opt.isRecommended}
                        onChange={(e) =>
                          updateOption(idx, { isRecommended: e.target.checked })
                        }
                        className="accent-emerald-600"
                      />
                      <span>Pilihan Tepat / Konstruktif</span>
                    </label>
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOptionSlot(idx)}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Opsi
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  required
                  minLength={2}
                  value={opt.optionText}
                  onChange={(e) =>
                    updateOption(idx, { optionText: e.target.value })
                  }
                  placeholder="Teks pilihan jawaban..."
                  className="clay-inset w-full px-3 py-2 text-sm"
                />

                <input
                  type="text"
                  required
                  minLength={4}
                  value={opt.feedbackText}
                  onChange={(e) =>
                    updateOption(idx, { feedbackText: e.target.value })
                  }
                  placeholder="Penjelasan edukatif jika siswa memilih opsi ini..."
                  className="clay-inset w-full px-3 py-2 text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="clay-btn-secondary px-4 py-2 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="clay-btn-primary px-5 py-2 text-sm"
            >
              {saving ? "Menyimpan..." : "Simpan Pertanyaan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Pertanyaan?"
        subtitle="Pertanyaan dan seluruh pilihan jawabannya akan dihapus."
      >
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="clay-btn-secondary px-4 py-2 text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className="px-5 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold cursor-pointer"
          >
            {saving ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
