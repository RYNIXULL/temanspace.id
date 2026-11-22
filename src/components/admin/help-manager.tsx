"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface HelpRow {
  id: string;
  title: string;
  audienceScope: "SCHOOL" | "HOME" | "SAFETY_STEPS";
  summary: string;
  whenToReachOut: string;
  steps: string[];
  contactRole: string;
  sortOrder: number;
  isPublished: boolean;
}

export function HelpResourcesManager() {
  const toast = useToast();
  const [items, setItems] = useState<HelpRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HelpRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HelpRow | null>(null);

  const [title, setTitle] = useState("");
  const [audienceScope, setAudienceScope] =
    useState<HelpRow["audienceScope"]>("SCHOOL");
  const [summary, setSummary] = useState("");
  const [whenToReachOut, setWhenToReachOut] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/help-resources");
      const data = await res.json();
      if (res.ok) setItems(data.resources || []);
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat memuat panduan bantuan.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/help-resources");
        const data = await res.json();
        if (active && res.ok) setItems(data.resources || []);
      } catch {
        if (active) toast.error("Gagal Memuat", "Tidak dapat memuat panduan bantuan.");
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
    setTitle("");
    setAudienceScope("SCHOOL");
    setSummary("");
    setWhenToReachOut("");
    setStepsText("");
    setContactRole("");
    setSortOrder(items.length + 1);
    setIsPublished(true);
    setFormOpen(true);
  };

  const openEdit = (r: HelpRow) => {
    setEditing(r);
    setTitle(r.title);
    setAudienceScope(r.audienceScope);
    setSummary(r.summary);
    setWhenToReachOut(r.whenToReachOut);
    setStepsText(r.steps.join("\n"));
    setContactRole(r.contactRole);
    setSortOrder(r.sortOrder);
    setIsPublished(r.isPublished);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const steps = stepsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const url = editing
        ? `/api/admin/help-resources/${editing.id}`
        : "/api/admin/help-resources";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          audienceScope,
          summary,
          whenToReachOut,
          steps,
          contactRole,
          sortOrder: Number(sortOrder),
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Periksa data panduan.");
        return;
      }

      toast.success("Panduan Disimpan", `Panduan "${data.resource.title}" disimpan.`);
      setFormOpen(false);
      await loadData();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan panduan bantuan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/help-resources/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menghapus", data.error);
        return;
      }
      toast.success("Panduan Dihapus", data.message);
      setDeleteTarget(null);
      await loadData();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghapus panduan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Panduan Bantuan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Kelola informasi pihak yang dapat dihubungi siswa di sekolah maupun
            rumah saat menghadapi situasi tidak aman.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="clay-btn-primary px-4 py-2.5 text-sm inline-flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Panduan</span>
        </button>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat panduan bantuan...
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((r) => (
            <div
              key={r.id}
              className="clay-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    {r.audienceScope}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Kontak: {r.contactRole}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {r.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {r.summary}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="clay-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(r)}
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
        title={editing ? "Ubah Panduan Bantuan" : "Tambah Panduan Bantuan"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">Judul Panduan</label>
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
              <label className="block text-sm font-bold mb-1">Lingkup</label>
              <select
                value={audienceScope}
                onChange={(e) =>
                  setAudienceScope(e.target.value as HelpRow["audienceScope"])
                }
                className="clay-inset w-full px-3 py-2.5 text-sm"
              >
                <option value="SCHOOL">Lingkungan Sekolah (SCHOOL)</option>
                <option value="HOME">Lingkungan Rumah (HOME)</option>
                <option value="SAFETY_STEPS">Langkah Keselamatan (SAFETY_STEPS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              Peran yang Dihubungi (tanpa nama pribadi)
            </label>
            <input
              type="text"
              required
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              placeholder="Contoh: Guru Bimbingan dan Konseling (BK) Sekolah"
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Ringkasan</label>
            <textarea
              rows={2}
              required
              minLength={10}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              Kapan Siswa Perlu Menghubungi?
            </label>
            <textarea
              rows={2}
              required
              minLength={5}
              value={whenToReachOut}
              onChange={(e) => setWhenToReachOut(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              Langkah Praktis (satu langkah per baris)
            </label>
            <textarea
              rows={4}
              required
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
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
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer pt-5">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 accent-sky-600"
              />
              <span>Terbitkan untuk siswa</span>
            </label>
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
              {saving ? "Menyimpan..." : "Simpan Panduan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Panduan Bantuan?"
        subtitle={deleteTarget?.title}
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
