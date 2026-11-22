import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const sessionUser = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F0F5FA] via-[#F7FAFE] to-[#EAF3FC] dark:from-[#090F1D] dark:via-[#0B1325] dark:to-[#090F1D]">
      <PublicHeader sessionRole={sessionUser?.roleCode ?? null} />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="clay-card p-7 sm:p-10">
            <span className="clay-badge inline-flex items-center gap-2 px-4 py-1.5 text-xs mb-4">
              <BookOpenCheck className="w-4 h-4" />
              <span>Tentang Produk</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
              Tentang TEMANSPACE.ID
            </h1>
            <p className="text-base sm:text-lg text-sky-700 dark:text-sky-300 font-semibold mt-2">
              &ldquo;ruang berteman, tempat bertumbuh&rdquo;
            </p>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              TEMANSPACE.ID adalah media layanan bimbingan dan konseling sosial
              berbasis website yang dirancang khusus untuk edukasi pertemanan
              sehat bagi siswa Sekolah Menengah Pertama (SMP). Website ini
              menyajikan materi bacaan terstruktur, pembangun kalimat asertif,
              latihan skenario pertemanan sehari-hari, serta panduan mencari
              bantuan yang aman.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="clay-card p-6 sm:p-7 space-y-3">
              <div className="clay-icon-box w-11 h-11 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Bukan Alat Diagnosis Psikologis
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Seluruh materi, kuis, dan skenario di TEMANSPACE.ID bersifat{" "}
                <strong>edukatif dan non-diagnostik</strong>. Aplikasi ini tidak
                memberikan label kondisi psikologis siswa dan bukan pengganti
                layanan konseling profesional maupun peran Guru Bimbingan dan
                Konseling (Guru BK).
              </p>
            </div>

            <div className="clay-card p-6 sm:p-7 space-y-3">
              <div className="clay-icon-box w-11 h-11 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Batasan Kerahasiaan & Keselamatan
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                TEMANSPACE.ID tidak menjanjikan kerahasiaan mutlak untuk hal-hal
                yang membahayakan keselamatan siswa. Apabila siswa menghadapi
                pengucilan berat, ancaman, kekerasan, atau perundungan, panduan
                layanan selalu mengarahkan siswa untuk segera melibatkan Guru
                BK, wali kelas, atau orang dewasa tepercaya.
              </p>
            </div>

            <div className="clay-card p-6 sm:p-7 space-y-3">
              <div className="clay-icon-box w-11 h-11 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Minimisasi Data Pribadi
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Karena sasaran utama adalah peserta didik SMP, aplikasi hanya
                mengumpulkan informasi dasar yang diperlukan untuk akses
                pembelajaran (nama tampilan, email, dan tingkat kelas SMP).
                Aplikasi tidak meminta alamat rumah, nomor telepon pribadi, atau
                dokumen identitas.
              </p>
            </div>

            <div className="clay-card p-6 sm:p-7 space-y-3">
              <div className="clay-icon-box w-11 h-11 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Alur Pendaftaran dengan Persetujuan Admin
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Setiap pendaftaran siswa baru berstatus{" "}
                <code className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-xs font-semibold">
                  pending
                </code>{" "}
                dan ditinjau terlebih dahulu oleh admin sebelum akun dapat
                digunakan untuk login. Siswa dapat memantau keputusannya
                menggunakan kode referensi di halaman Status Pendaftaran.
              </p>
            </div>
          </div>

          <div className="clay-card-blue p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Siap Bergabung di TEMANSPACE.ID?</h2>
              <p className="text-sm text-sky-50 mt-1">
                Ajukan pendaftaran akun siswa atau cek status pendaftaranmu sekarang.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-sky-700 font-bold text-sm hover:bg-sky-50 transition-colors"
              >
                <span>Daftar Akun</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/status-pendaftaran"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-700/40 border border-white/40 text-white font-bold text-sm hover:bg-sky-700/60 transition-colors"
              >
                <span>Cek Status</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
