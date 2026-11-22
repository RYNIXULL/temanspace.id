"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Edit3, ListChecks, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface CategoryOption {
  id: string;
  name: string;
}

interface QuizRow {
  id: string;
  categoryId: string | null;
  slug: string;
  title: string;
  description: string;
  type: "QUIZ" | "SCENARIO";
  sortOrder: number;
  isPublished: boolean;
  category: CategoryOption | null;
  _count: { questions: number; attempts: number };
}

export function QuizzesManager({
  quizType,
}: {
  quizType: "QUIZ" | "SCENARIO";
}) {
  const toast = useToast();
  const isScenario = quizType === "SCENARIO";
  const labelSingular = isScenario ? "Skenario" : "Kuis";

  const [items, setItems] = useState<QuizRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuizRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        fetch(`/api/admin/quizzes?type=${quizType}`),
        fetch("/api/admin/categories"),
      ]);
      const qData = await qRes.json();
      const cData = await cRes.json();
      if (qRes.ok) setItems(qData.quizzes || []);
      if (cRes.ok) setCategories(cData.categories || []);
    } catch {
      toast.error("Gagal Memuat", `Tidak dapat memuat daftar ${labelSingular}.`);
    } finally {
      setLoading(false);
    }
  }, [labelSingular, quizType, toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [qRes, cRes] = await Promise.all([
          fetch(`/api/admin/quizzes?type=${quizType}`),
          fetch("/api/admin/categories"),
        ]);
        const qData = await qRes.json();
        const cData = await cRes.json();
        if (!active) return;
        if (qRes.ok) setItems(qData.quizzes || []);
        if (cRes.ok) setCategories(cData.categories || []);
      } catch {
        if (active) {
          toast.error("Gagal Memuat", `Tidak dapat memuat daftar ${labelSingular}.`);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [labelSingular, quizType, toast]);

  const openCreate = () => {
    setEditing(null);
    setCategoryId(categories[0]?.id || "");
    setTitle("");
    setDescription("");
    setSortOrder(items.length + 1);
    setIsPublished(true);
    setFormOpen(true);
  };

  const openEdit = (q: QuizRow) => {
    setEditing(q);
    setCategoryId(q.categoryId || "");
    setTitle(q.title);
    setDescription(q.description);
    setSortOrder(q.sortOrder);
    setIsPublished(q.isPublished);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/quizzes/${editing.id}`
        : "/api/admin/quizzes";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categoryId || null,
          title,
          description,
          type: quizType,
          sortOrder: Number(sortOrder),
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Periksa kembali data.");
        return;
      }

      toast.success(
        `${labelSingular} Disimpan`,
        `${labelSingular} "${data.quiz.title}" berhasil disimpan.`
      );
      setFormOpen(false);
      await loadData();
    } catch {
      toast.error("Kesalahan Jaringan", `Gagal menyimpan ${labelSingular}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menghapus", data.error);
        return;
      }
      toast.success(`${labelSingular} Dihapus`, data.message);
      setDeleteTarget(null);
      await loadData();
    } catch {
      toast.error("Kesalahan Jaringan", `Gagal menghapus ${labelSingular}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen {labelSingular}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {isScenario
              ? "Kelola skenario simulasi situasi pertemanan sehari-hari beserta pertanyaan dan pembahasan edukatif."
              : "Kelola kuis pemahaman materi pertemanan sehat beserta daftar pertanyaan dan pilihan jawaban."}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="clay-btn-primary px-4 py-2.5 text-sm inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah {labelSingular}</span>
        </button>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat daftar {labelSingular.toLowerCase()}...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Belum ada {labelSingular.toLowerCase()} yang dibuat.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="clay-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {item.category && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                      {item.category.name}
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      item.isPublished
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.isPublished ? "Terbit" : "Draft"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item._count.questions} pertanyaan • {item._count.attempts} kali dikerjakan
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href={`/admin/kuis/${item.id}/pertanyaan`}
                  className="clay-btn-primary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Kelola Pertanyaan & Opsi</span>
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="clay-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Ubah ${labelSingular}` : `Tambah ${labelSingular}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">
              Kategori Terkait (Opsional)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="clay-inset w-full px-3 py-2.5 text-sm"
            >
              <option value="">Umum / Lintas Topik</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">
              Judul {labelSingular}
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Deskripsi</label>
            <textarea
              rows={3}
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm resize-none"
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
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-sky-600"
            />
            <span>Terbitkan untuk siswa</span>
          </label>
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
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Hapus ${labelSingular}?`}
        subtitle={
          deleteTarget
            ? `Semua pertanyaan dan riwayat pengerjaan "${deleteTarget.title}" juga akan dihapus.`
            : undefined
        }
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
