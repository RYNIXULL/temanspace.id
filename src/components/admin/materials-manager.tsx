"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface MaterialRow {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  keyPoints: string[];
  examples: Array<{ situation: string; response: string }>;
  readingMinutes: number;
  sortOrder: number;
  isPublished: boolean;
  category: CategoryOption;
}

export function MaterialsManager() {
  const toast = useToast();
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialRow | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");
  const [exampleSituation, setExampleSituation] = useState("");
  const [exampleResponse, setExampleResponse] = useState("");
  const [readingMinutes, setReadingMinutes] = useState(5);
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [matRes, catRes] = await Promise.all([
        fetch("/api/admin/materials"),
        fetch("/api/admin/categories"),
      ]);
      const matData = await matRes.json();
      const catData = await catRes.json();
      if (matRes.ok) setMaterials(matData.materials || []);
      if (catRes.ok) {
        setCategories(catData.categories || []);
      }
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat memuat daftar materi.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [matRes, catRes] = await Promise.all([
          fetch("/api/admin/materials"),
          fetch("/api/admin/categories"),
        ]);
        const matData = await matRes.json();
        const catData = await catRes.json();
        if (!active) return;
        if (matRes.ok) setMaterials(matData.materials || []);
        if (catRes.ok) {
          setCategories(catData.categories || []);
          setCategoryId((prev) => prev || catData.categories?.[0]?.id || "");
        }
      } catch {
        if (active) toast.error("Gagal Memuat", "Tidak dapat memuat daftar materi.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const openCreate = () => {
    setEditing(null);
    setCategoryId(categories[0]?.id || "");
    setTitle("");
    setSummary("");
    setContent("");
    setKeyPointsText("");
    setExampleSituation("");
    setExampleResponse("");
    setReadingMinutes(5);
    setSortOrder(1);
    setIsPublished(true);
    setFormOpen(true);
  };

  const openEdit = (m: MaterialRow) => {
    setEditing(m);
    setCategoryId(m.categoryId);
    setTitle(m.title);
    setSummary(m.summary);
    setContent(m.content);
    setKeyPointsText(m.keyPoints.join("\n"));
    setExampleSituation(m.examples[0]?.situation || "");
    setExampleResponse(m.examples[0]?.response || "");
    setReadingMinutes(m.readingMinutes);
    setSortOrder(m.sortOrder);
    setIsPublished(m.isPublished);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const keyPoints = keyPointsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const examples =
        exampleSituation.trim() && exampleResponse.trim()
          ? [{ situation: exampleSituation.trim(), response: exampleResponse.trim() }]
          : [];

      const url = editing
        ? `/api/admin/materials/${editing.id}`
        : "/api/admin/materials";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title,
          summary,
          content,
          keyPoints,
          examples,
          readingMinutes: Number(readingMinutes),
          sortOrder: Number(sortOrder),
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Periksa data materi.");
        return;
      }

      toast.success(
        editing ? "Materi Diperbarui" : "Materi Ditambahkan",
        `Materi "${data.material.title}" berhasil disimpan.`
      );
      setFormOpen(false);
      await loadAll();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan materi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/materials/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menghapus", data.error);
        return;
      }
      toast.success("Materi Dihapus", data.message);
      setDeleteTarget(null);
      await loadAll();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghapus materi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Materi Edukasi
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Buat, sunting, dan terbitkan modul pembelajaran pertemanan sehat
            untuk siswa SMP.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="clay-btn-primary px-4 py-2.5 text-sm inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Materi</span>
        </button>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat materi...
        </div>
      ) : (
        <div className="space-y-3.5">
          {materials.map((m) => (
            <div
              key={m.id}
              className="clay-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    {m.category.name}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      m.isPublished
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {m.isPublished ? "Terbit" : "Draft"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {m.readingMinutes} menit
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {m.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {m.summary}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(m)}
                  className="clay-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(m)}
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
        title={editing ? "Ubah Materi Edukasi" : "Tambah Materi Edukasi"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">Kategori</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="clay-inset w-full px-3 py-2.5 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Judul Materi</label>
              <input
                type="text"
                required
                minLength={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Ringkasan Singkat</label>
            <input
              type="text"
              required
              minLength={10}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Isi Materi</label>
            <textarea
              rows={6}
              required
              minLength={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              Poin Utama (satu poin per baris)
            </label>
            <textarea
              rows={3}
              value={keyPointsText}
              onChange={(e) => setKeyPointsText(e.target.value)}
              placeholder={"Poin 1\nPoin 2"}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">
                Contoh Situasi (Opsional)
              </label>
              <input
                type="text"
                value={exampleSituation}
                onChange={(e) => setExampleSituation(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">
                Contoh Respons Sehat (Opsional)
              </label>
              <input
                type="text"
                value={exampleResponse}
                onChange={(e) => setExampleResponse(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">Durasi Baca (menit)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={readingMinutes}
                onChange={(e) => setReadingMinutes(Number(e.target.value))}
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
              {saving ? "Menyimpan..." : "Simpan Materi"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Materi?"
        subtitle={
          deleteTarget
            ? `Materi "${deleteTarget.title}" akan dihapus permanen.`
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
