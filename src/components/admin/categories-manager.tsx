"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  sortOrder: number;
  isPublished: boolean;
  _count: { materials: number; quizzes: number };
}

const ICON_OPTIONS = [
  { value: "heart-handshake", label: "Pertemanan Sehat (Hati)" },
  { value: "shield-alert", label: "Relasi Tidak Sehat (Perisai)" },
  { value: "messages-square", label: "Komunikasi Interpersonal (Obrolan)" },
  { value: "message-circle-check", label: "Komunikasi Asertif (Dialog)" },
  { value: "hand-heart", label: "Belajar Empati (Peduli)" },
  { value: "scale", label: "Menghadapi Konflik (Keseimbangan)" },
  { value: "book-open", label: "Umum (Buku)" },
];

export function CategoriesManager() {
  const toast = useToast();
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("book-open");
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) setItems(data.categories || []);
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat memuat kategori materi.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (active && res.ok) setItems(data.categories || []);
      } catch {
        if (active) toast.error("Gagal Memuat", "Tidak dapat memuat kategori materi.");
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
    setName("");
    setSlug("");
    setDescription("");
    setIconName("book-open");
    setSortOrder(items.length + 1);
    setIsPublished(true);
    setFormOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setIconName(cat.iconName);
    setSortOrder(cat.sortOrder);
    setIsPublished(cat.isPublished);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/categories/${editing.id}`
        : "/api/admin/categories";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug.trim() || undefined,
          description,
          iconName,
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
        editing ? "Kategori Diperbarui" : "Kategori Dibuat",
        `Kategori "${data.category.name}" berhasil disimpan.`
      );
      setFormOpen(false);
      await loadData();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menghapus", data.error);
        return;
      }
      toast.success("Kategori Dihapus", data.message);
      setDeleteTarget(null);
      await loadData();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghapus kategori.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Kategori Materi
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Atur kategori topik edukasi, urutan tampil, dan status publikasi.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="clay-btn-primary px-4 py-2.5 text-sm inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat kategori...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="clay-card p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    #{cat.sortOrder} • {cat.slug}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      cat.isPublished
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {cat.isPublished ? "Terbit" : "Draft"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {cat.description}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cat._count.materials} materi • {cat._count.quizzes} latihan
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="clay-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
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
        title={editing ? "Ubah Kategori Materi" : "Tambah Kategori Materi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nama Kategori</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">
              Slug URL (opsional)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="otomatis-dari-nama"
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Deskripsi</label>
            <textarea
              rows={3}
              required
              minLength={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">Ikon</label>
              <select
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                className="clay-inset w-full px-3 py-2.5 text-sm"
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Kategori?"
        subtitle={
          deleteTarget
            ? `Menghapus kategori "${deleteTarget.name}" juga menghapus materi di dalamnya.`
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
