"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Save, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export function ProfileEditor({
  initialFullName,
  email,
  initialGradeLevel,
  roleCode,
}: {
  initialFullName: string;
  email: string;
  initialGradeLevel: string | null;
  roleCode: "ADMIN" | "STUDENT";
}) {
  const router = useRouter();
  const toast = useToast();

  const [fullName, setFullName] = useState(initialFullName);
  const [gradeLevel, setGradeLevel] = useState<"7" | "8" | "9">(
    initialGradeLevel === "8" || initialGradeLevel === "9"
      ? initialGradeLevel
      : "7"
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, gradeLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Periksa kembali datamu.");
        return;
      }
      toast.success("Profil Diperbarui", "Informasi profil berhasil disimpan.");
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal memperbarui profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Kata Sandi Tidak Cocok", "Ulangi kata sandi baru dengan benar.");
      return;
    }

    setSavingPass(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Mengubah Sandi", data.error || "Terjadi kesalahan.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Kata Sandi Diperbarui", data.message);
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal mengubah kata sandi.");
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Profil Akun
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Kami hanya menyimpan data minimal yang diperlukan untuk pengalaman
          belajar.
        </p>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 max-w-xl">
          <div>
            <label
              htmlFor="prof-email"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Email Akun
            </label>
            <input
              id="prof-email"
              type="email"
              disabled
              value={email}
              className="clay-inset w-full px-3.5 py-2.5 text-sm opacity-75 cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="prof-name"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Nama Tampilan
            </label>
            <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="prof-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          {roleCode === "STUDENT" && (
            <div>
              <label
                htmlFor="prof-grade"
                className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Tingkat Kelas SMP
              </label>
              <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  id="prof-grade"
                  value={gradeLevel}
                  onChange={(e) =>
                    setGradeLevel(e.target.value as "7" | "8" | "9")
                  }
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
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
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="clay-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{savingProfile ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </form>
      </div>

      <div className="clay-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Ubah Kata Sandi
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          <div>
            <label
              htmlFor="curr-pass"
              className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
            >
              Kata Sandi Saat Ini
            </label>
            <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                id="curr-pass"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="new-pass"
                className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Kata Sandi Baru
              </label>
              <input
                id="new-pass"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 karakter + angka"
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-new-pass"
                className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5"
              >
                Ulangi Kata Sandi Baru
              </label>
              <input
                id="confirm-new-pass"
                type="password"
                required
                minLength={8}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPass}
            className="clay-btn-secondary px-5 py-2.5 text-sm"
          >
            {savingPass ? "Memperbarui..." : "Perbarui Kata Sandi"}
          </button>
        </form>
      </div>
    </div>
  );
}
