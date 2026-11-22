"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export function AdminSettingsEditor({
  initialFullName,
  email,
}: {
  initialFullName: string;
  email: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [fullName, setFullName] = useState(initialFullName);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Gagal Menyimpan", data.error || "Terjadi kesalahan.");
        return;
      }
      toast.success("Pengaturan Disimpan", data.message);
      router.refresh();
    } catch {
      toast.error("Kesalahan Jaringan", "Gagal menyimpan pengaturan.");
    } finally {
      setSavingName(false);
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pengaturan Akun Admin
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Kelola identitas pengelola dan keamanan kata sandi akun admin.
        </p>

        <form onSubmit={handleSaveName} className="mt-6 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-bold mb-1">Email Admin</label>
            <input
              type="email"
              disabled
              value={email}
              className="clay-inset w-full px-3.5 py-2.5 text-sm opacity-75 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Nama Tampilan</label>
            <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingName}
            className="clay-btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{savingName ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </form>
      </div>

      <div className="clay-card p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Keamanan Kata Sandi Admin
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-bold mb-1">
              Kata Sandi Saat Ini
            </label>
            <div className="clay-inset flex items-center gap-2.5 px-3.5 py-2.5">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <input
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
              <label className="block text-sm font-bold mb-1">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">
                Ulangi Kata Sandi Baru
              </label>
              <input
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
