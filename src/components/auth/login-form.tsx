"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    code?: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusNotice(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Gagal masuk ke akun.";
        setStatusNotice({ code: data.code, message: msg });
        toast.error("Tidak Dapat Masuk", msg);
        return;
      }

      toast.success("Berhasil Masuk", `Selamat datang, ${data.user.fullName}.`);
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : null;

      if (data.user.roleCode === "ADMIN") {
        router.push(safeNext?.startsWith("/admin") ? safeNext : "/admin");
      } else {
        router.push(
          safeNext?.startsWith("/dashboard") ? safeNext : "/dashboard"
        );
      }
      router.refresh();
    } catch {
      const msg = "Terjadi gangguan koneksi. Coba beberapa saat lagi.";
      setStatusNotice({ message: msg });
      toast.error("Kesalahan Jaringan", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="clay-card p-6 sm:p-9 max-w-md w-full mx-auto">
      <div className="text-center mb-7">
        <div className="clay-icon-box w-14 h-14 mx-auto flex items-center justify-center mb-4">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Masuk ke TEMANSPACE.ID
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
          Gunakan akun siswa yang sudah disetujui atau akun admin.
        </p>
      </div>

      {statusNotice && (
        <div
          role="alert"
          className={`mb-5 rounded-2xl p-4 border text-sm flex items-start gap-3 ${
            statusNotice.code === "ACCOUNT_PENDING"
              ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700/60 text-amber-900 dark:text-amber-200"
              : "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-700/60 text-rose-900 dark:text-rose-200"
          }`}
        >
          {statusNotice.code === "ACCOUNT_PENDING" ? (
            <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          )}
          <div className="space-y-1.5">
            <p className="font-semibold leading-snug">{statusNotice.message}</p>
            {statusNotice.code === "ACCOUNT_PENDING" && (
              <Link
                href="/status-pendaftaran"
                className="inline-flex items-center gap-1 text-xs font-bold underline"
              >
                <span>Buka Status Pendaftaran</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Email
          </label>
          <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.sch.id"
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            Kata Sandi
          </label>
          <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 text-sm sm:text-base clay-btn-primary mt-2"
        >
          {submitting ? "Memeriksa Akun..." : "Masuk"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-center space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
        <p>
          Belum punya akun siswa?{" "}
          <Link
            href="/daftar"
            className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
        <p>
          Sudah mendaftar?{" "}
          <Link
            href="/status-pendaftaran"
            className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Cek Status Pendaftaran
          </Link>
        </p>
      </div>
    </div>
  );
}
