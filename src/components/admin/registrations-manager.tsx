"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { Modal } from "@/components/ui/modal";

interface RegistrationItem {
  id: string;
  referenceCode: string;
  reasonNote: string | null;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    gradeLevel: string | null;
    status: string;
  };
  reviewedBy: {
    fullName: string;
    email: string;
  } | null;
}

export function RegistrationsManager() {
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalTarget, setModalTarget] = useState<{
    item: RegistrationItem;
    decision: "approve" | "reject";
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/registrations${qs}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.registrations || []);
      }
    } catch {
      toast.error("Gagal Memuat", "Tidak dapat memuat daftar pendaftaran.");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const qs = filter === "all" ? "" : `?status=${filter}`;
        const res = await fetch(`/api/admin/registrations${qs}`);
        const data = await res.json();
        if (active && res.ok) {
          setItems(data.registrations || []);
        }
      } catch {
        if (active) toast.error("Gagal Memuat", "Tidak dapat memuat daftar pendaftaran.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filter, toast]);

  const openDecisionModal = (
    item: RegistrationItem,
    decision: "approve" | "reject"
  ) => {
    setReviewNote("");
    setModalTarget({ item, decision });
  };

  const submitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${modalTarget.item.id}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: modalTarget.decision,
            reviewNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Memproses", data.error || "Terjadi kesalahan.");
        return;
      }

      toast.success("Keputusan Tersimpan", data.message);
      setModalTarget(null);
      await fetchItems();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan keputusan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Persetujuan Pendaftaran Siswa
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Setujui atau tolak permohonan akun siswa baru. Setiap keputusan
            tercatat otomatis pada audit log.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                filter === tab
                  ? "bg-sky-600 text-white"
                  : "bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {tab === "pending"
                ? "Pending"
                : tab === "approved"
                ? "Disetujui"
                : tab === "rejected"
                ? "Ditolak"
                : "Semua"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Memuat daftar permohonan...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card p-8 text-center text-sm text-slate-500">
          Tidak ada permohonan pendaftaran untuk filter ini.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="clay-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300">
                    {item.referenceCode}
                  </span>
                  {item.status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}
                  {item.status === "approved" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Disetujui
                    </span>
                  )}
                  {item.status === "rejected" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      Ditolak
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.user.fullName}{" "}
                  {item.user.gradeLevel ? `(Kelas ${item.user.gradeLevel} SMP)` : ""}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {item.user.email} • Daftar pada{" "}
                  {new Date(item.createdAt).toLocaleString("id-ID")}
                </p>
                {item.reasonNote && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2.5 mt-1">
                    Catatan siswa: &ldquo;{item.reasonNote}&rdquo;
                  </p>
                )}
                {item.reviewNote && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Catatan admin: {item.reviewNote}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openDecisionModal(item, "approve")}
                  className="px-4 py-2 text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  onClick={() => openDecisionModal(item, "reject")}
                  className="px-4 py-2 text-xs sm:text-sm rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(modalTarget)}
        onClose={() => setModalTarget(null)}
        title={
          modalTarget?.decision === "approve"
            ? "Setujui Pendaftaran Siswa"
            : "Tolak Pendaftaran Siswa"
        }
        subtitle={
          modalTarget
            ? `${modalTarget.item.user.fullName} (${modalTarget.item.user.email})`
            : undefined
        }
      >
        <form onSubmit={submitDecision} className="space-y-4">
          <div>
            <label
              htmlFor="decision-note"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Catatan Keputusan (Opsional)
            </label>
            <textarea
              id="decision-note"
              rows={3}
              maxLength={300}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={
                modalTarget?.decision === "approve"
                  ? "Contoh: Akun disetujui untuk akses materi pembelajaran."
                  : "Contoh: Data pendaftaran belum sesuai."
              }
              className="clay-inset w-full px-3.5 py-2.5 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalTarget(null)}
              className="clay-btn-secondary px-4 py-2 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="clay-btn-primary px-5 py-2 text-sm"
            >
              {submitting
                ? "Menyimpan..."
                : modalTarget?.decision === "approve"
                ? "Konfirmasi Setujui"
                : "Konfirmasi Tolak"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
