import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-white/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="keep-light relative w-14 h-10 rounded-xl bg-white border border-slate-200/70 shadow-sm overflow-hidden shrink-0">
                <Image
                  src="/images/temanspace-logo.jpg"
                  alt="Logo TEMANSPACE.ID"
                  fill
                  sizes="56px"
                  className="object-contain p-0.5"
                />
              </span>
              <div>
                <p className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                  TEMANSPACE<span className="text-sky-600 dark:text-sky-400">.ID</span>
                </p>
                <p className="text-xs text-sky-700 dark:text-sky-300 font-semibold">
                  ruang berteman, tempat bertumbuh
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Media layanan bimbingan dan konseling sosial berbasis website untuk
              edukasi pertemanan sehat bagi siswa Sekolah Menengah Pertama (SMP).
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-slate-800 dark:text-slate-100">
              Navigasi
            </p>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-sky-600 dark:hover:text-sky-400">
                  Tentang TEMANSPACE.ID
                </Link>
              </li>
              <li>
                <Link href="/daftar" className="hover:text-sky-600 dark:hover:text-sky-400">
                  Registrasi Akun Siswa
                </Link>
              </li>
              <li>
                <Link href="/status-pendaftaran" className="hover:text-sky-600 dark:hover:text-sky-400">
                  Cek Status Pendaftaran
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-sky-600 dark:hover:text-sky-400">
                  Masuk
                </Link>
              </li>
            </ul>
          </div>

          <div className="clay-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="clay-icon-box p-2.5 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Batasan Layanan Edukatif
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  TEMANSPACE.ID adalah media edukasi sosial, bukan alat diagnosis
                  psikologis dan bukan pengganti peran Guru BK maupun konseling
                  profesional. Jika mengalami ancaman atau perundungan, segera
                  hubungi Guru BK atau orang dewasa tepercaya.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>TEMANSPACE.ID — Layanan Edukasi Pertemanan Sehat Siswa SMP.</p>
          <p>Dirancang dengan prinsip aman, ramah, dan non-diagnostik.</p>
        </div>
      </div>
    </footer>
  );
}
