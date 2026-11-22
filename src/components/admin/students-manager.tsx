"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, Edit3, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface StudentRow {
  id: string;
  fullName: string;
  email: string;
  gradeLevel: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  createdAt: string;
  _count: {
    quizAttempts: number;
    materialProgress: number;
  };
}

export function StudentsManager() {
  const toast = useToast();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<StudentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<"7" | "8" | "9">("7");
  const [status, setStatus] = useState<StudentRow["status"]>("approved");
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok) setStudents(data.students || []);
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat mengambil daftar akun siswa.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/students");
        const data = await res.json();
        if (active && res.ok) setStudents(data.students || []);
      } catch {
        if (active) toast.error("Gagal Memuat", "Tidak dapat mengambil daftar akun siswa.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const openEdit = (s: StudentRow) => {
    setEditTarget(s);
    setFullName(s.fullName);
    setGradeLevel(
      s.gradeLevel === "8" || s.gradeLevel === "9" ? s.gradeLevel : "7"
    );
    setStatus(s.status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, gradeLevel, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Terjadi kesalahan.");
        return;
      }
      toast.success("Akun Diperbarui", data.message);
      setEditTarget(null);
      await loadStudents();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal memperbarui akun siswa.");
    } finally {
      setSaving(false);
    }
  };

  const quickToggleSuspend = async (s: StudentRow) => {
    const nextStatus = s.status === "suspended" ? "approved" : "suspended";
    try {
      const res = await fetch(`/api/admin/students/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Memperbarui", data.error);
        return;
      }
      toast.success(
        nextStatus === "suspended" ? "Akun Ditangguhkan" : "Akun Diaktifkan",
        `${s.fullName} kini berstatus ${nextStatus}.`
      );
      await loadStudents();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal mengubah status akun.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/students/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menghapus", data.error);
        return;
      }
      toast.success("Akun Dihapus", data.message);
      setDeleteTarget(null);
      await loadStudents();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menghapus akun.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Manajemen Akun Siswa
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Kelola status aktif, penangguhan (suspend), atau pembaruan data dasar
          akun siswa.
        </p>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat daftar siswa...
        </div>
      ) : students.length === 0 ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Belum ada akun siswa yang terdaftar.
        </div>
      ) : (
        <div className="space-y-3.5">
          {students.map((s) => (
            <div
              key={s.id}
              className="clay-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {s.fullName}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    Kelas {s.gradeLevel || "-"}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      s.status === "approved"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : s.status === "suspended"
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        : s.status === "rejected"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {s.email} • {s._count.materialProgress} materi dibaca •{" "}
                  {s._count.quizAttempts} latihan selesai
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {s.status !== "pending" && (
                  <button
                    type="button"
                    onClick={() => quickToggleSuspend(s)}
                    className="clay-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                  >
                    {s.status === "suspended" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aktifkan</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5 text-amber-600" />
                        <span>Suspend</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="clay-btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(s)}
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
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Ubah Data Akun Siswa"
        subtitle={editTarget?.email}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nama Tampilan</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1">Tingkat Kelas</label>
              <select
                value={gradeLevel}
                onChange={(e) =>
                  setGradeLevel(e.target.value as "7" | "8" | "9")
                }
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Status Akun</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as StudentRow["status"])
                }
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              >
                <option value="approved">approved</option>
                <option value="suspended">suspended</option>
                <option value="rejected">rejected</option>
                <option value="pending">pending</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
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
        title="Hapus Akun Siswa?"
        subtitle={
          deleteTarget
            ? `Akun ${deleteTarget.fullName} (${deleteTarget.email}) akan dihapus permanen.`
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
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold cursor-pointer"
          >
            {saving ? "Menghapus..." : "Ya, Hapus Akun"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
