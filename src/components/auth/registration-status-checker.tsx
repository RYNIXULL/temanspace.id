"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  KeyRound,
  Mail,
  Search,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface RegistrationResult {
  referenceCode: string;
  fullName: string;
  gradeLevel: string | null;
  requestStatus: "pending" | "approved" | "rejected";
  accountStatus: "pending" | "approved" | "rejected" | "suspended";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export function RegistrationStatusChecker() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/registration-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referenceCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Data pendaftaran tidak ditemukan.";
        setErrorMsg(msg);
        toast.error("Tidak Ditemukan", msg);
        return;
      }

      setResult(data.registration);
      toast.info("Status Ditemukan", `Status akun: ${data.registration.accountStatus}`);
    } catch {
      const msg = "Gagal memeriksa status karena gangguan koneksi.";
      setErrorMsg(msg);
      toast.error("Kesalahan Jaringan", msg);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: RegistrationResult["accountStatus"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Disetujui (Aktif)</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
            <XCircle className="w-4 h-4" />
            <span>Ditolak</span>
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            <Ban className="w-4 h-4" />
            <span>Dinonaktifkan (Suspended)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Clock className="w-4 h-4" />
            <span>Menunggu Persetujuan (Pending)</span>
          </span>
        );
    }
  };

  return (
    <div className="clay-card p-6 sm:p-9 max-w-lg w-full mx-auto space-y-6">
      <div className="text-center">
        <div className="clay-icon-box w-14 h-14 mx-auto flex items-center justify-center mb-4">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Cek Status Pendaftaran
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
          Masukkan email dan kode referensi pendaftaran (contoh:{" "}
          <code className="font-bold">TS-A1B2C3</code>) untuk melihat status
          persetujuan admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="status-email"
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Email Terdaftar
          </label>
          <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="status-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="siswa@contoh.id"
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="status-code"
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Kode Referensi Pendaftaran
          </label>
          <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
            <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="status-code"
              type="text"
              required
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
              placeholder="TS-XXXXXX"
              className="w-full bg-transparent text-sm font-mono uppercase text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm sm:text-base clay-btn-primary inline-flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? "Memeriksa..." : "Periksa Status"}</span>
        </button>
      </form>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-700/60 text-sm text-rose-800 dark:text-rose-200"
        >
          {errorMsg}
        </div>
      )}

      {result && (
        <div className="rounded-2xl bg-sky-50/75 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemohon ({result.referenceCode})
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {result.fullName}{" "}
                {result.gradeLevel ? `• Kelas ${result.gradeLevel} SMP` : ""}
              </p>
            </div>
            {renderStatusBadge(result.accountStatus)}
          </div>

          {result.reviewNote && (
            <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 p-3 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
              <span className="font-bold block mb-0.5">Catatan Admin:</span>
              {result.reviewNote}
            </div>
          )}

          {result.accountStatus === "approved" && (
            <Link
              href="/login"
              className="block w-full text-center py-2.5 px-4 text-sm clay-btn-primary"
            >
              Masuk ke Dashboard Siswa
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
