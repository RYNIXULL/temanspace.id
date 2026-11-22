"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export function RegisterForm() {
  const toast = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState<"7" | "8" | "9">("7");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    referenceCode: string;
    message: string;
  } | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kode Disalin", `Kode referensi ${code} berhasil disalin.`);
    } catch {
      toast.info("Simpan Kode", `Catat kode referensimu: ${code}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      const msg = "Konfirmasi kata sandi tidak cocok.";
      setErrorMsg(msg);
      toast.error("Periksa Data", msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          gradeLevel,
          password,
          confirmPassword,
          reasonNote,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Gagal mengirim pendaftaran.";
        setErrorMsg(msg);
        toast.error("Pendaftaran Gagal", msg);
        return;
      }

      setCreatedResult({
        referenceCode: data.referenceCode,
        message: data.message,
      });
      toast.success(
        "Pendaftaran Terkirim",
        `Kode referensi kamu: ${data.referenceCode}`
      );
    } catch {
      const msg = "Gangguan jaringan saat mengirim pendaftaran.";
      setErrorMsg(msg);
      toast.error("Kesalahan Jaringan", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (createdResult) {
    return (
      <div className="clay-card p-6 sm:p-9 max-w-lg w-full mx-auto text-center space-y-5">
        <div className="clay-icon-box w-16 h-16 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Pendaftaran Berhasil Dikirim
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {createdResult.message}
          </p>
        </div>

        <div className="rounded-2xl bg-sky-50/80 dark:bg-slate-800/80 border-2 border-sky-200/80 dark:border-sky-500/30 p-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            Kode Referensi Pendaftaran Kamu
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-slate-900 dark:text-white">
              {createdResult.referenceCode}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(createdResult.referenceCode)}
              aria-label="Salin kode referensi"
              className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-sky-200 dark:border-slate-600 text-sky-700 dark:text-sky-300 hover:bg-sky-100 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simpan kode ini untuk memeriksa status persetujuan akunmu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/status-pendaftaran"
            className="flex-1 py-3 px-5 text-sm text-center clay-btn-primary"
          >
            Cek Status Pendaftaran
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 px-5 text-sm text-center clay-btn-secondary"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="clay-card p-6 sm:p-9 max-w-lg w-full mx-auto">
      <div className="text-center mb-6">
        <div className="clay-icon-box w-14 h-14 mx-auto flex items-center justify-center mb-4">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Registrasi Akun Siswa
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
          Kami hanya meminta informasi minimal untuk akses belajar. Akun akan
          ditinjau admin sebelum aktif.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-5 rounded-2xl p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-700/60 text-sm text-rose-800 dark:text-rose-200 font-medium"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reg-name"
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Nama Panggilan / Nama Lengkap
          </label>
          <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="reg-name"
              name="fullName"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Raka Pratama"
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="reg-email"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Email
            </label>
            <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siswa@contoh.id"
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-grade"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Tingkat Kelas
            </label>
            <div className="clay-inset flex items-center gap-2 px-3 py-2.5">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                id="reg-grade"
                name="gradeLevel"
                value={gradeLevel}
                onChange={(e) =>
                  setGradeLevel(e.target.value as "7" | "8" | "9")
                }
                className="w-full bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="7" className="dark:bg-slate-900">
                  Kelas 7 SMP
                </option>
                <option value="8" className="dark:bg-slate-900">
                  Kelas 8 SMP
                </option>
                <option value="9" className="dark:bg-slate-900">
                  Kelas 9 SMP
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter + angka"
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-confirm"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Ulangi Kata Sandi
            </label>
            <div className="clay-inset flex items-center gap-2 px-3.5 py-2.5">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang sandi"
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-note"
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Catatan Singkat (Opsional)
          </label>
          <textarea
            id="reg-note"
            name="reasonNote"
            rows={2}
            maxLength={300}
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            placeholder="Contoh: Ingin belajar materi komunikasi asertif dan pertemanan sehat."
            className="clay-inset w-full px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none"
          />
        </div>

        <div className="rounded-2xl bg-sky-50/75 dark:bg-slate-800/70 border border-sky-200/70 dark:border-slate-700 p-3.5 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p>
            Jangan masukkan nomor telepon, alamat rumah, atau data sensitif
            lainnya. Setelah mendaftar, akun berstatus{" "}
            <strong>pending</strong> hingga disetujui admin.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 text-sm sm:text-base clay-btn-primary"
        >
          {submitting ? "Mengirim Pendaftaran..." : "Daftar Akun Siswa"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        Sudah punya akun aktif?{" "}
        <Link
          href="/login"
          className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
        >
          Masuk di sini
        </Link>
      </div>
    </div>
  );
}
