import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HeartHandshake,
  LifeBuoy,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { StreamlineAssetIcon } from "@/components/ui/streamline-icon";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sessionUser, categories, materialCount, quizCount, scenarioCount] =
    await Promise.all([
      getSessionUser(),
      prisma.materialCategory.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: { materials: { where: { isPublished: true } } },
          },
        },
      }),
      prisma.material.count({ where: { isPublished: true } }),
      prisma.quiz.count({ where: { isPublished: true, type: "QUIZ" } }),
      prisma.quiz.count({ where: { isPublished: true, type: "SCENARIO" } }),
    ]);

  const objectives = [
    "Memahami ciri-ciri pertemanan sehat dan saling menghargai.",
    "Mengenali perilaku dalam relasi tidak sehat seperti mengejek, mengontrol, mengucilkan, atau memaksa.",
    "Melatih komunikasi interpersonal: mendengarkan aktif dan menghargai perbedaan.",
    "Mempraktikkan komunikasi asertif dengan kalimat \"Aku merasa... ketika...\".",
    "Mengembangkan empati dan cara memberi dukungan yang tepat bagi teman.",
    "Menghadapi konflik pertemanan dengan tenang dan mencari kesepakatan aman.",
    "Mengetahui kapan dan kepada siapa mencari bantuan saat mengalami pengucilan, ancaman, atau perundungan.",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#F0F5FA] via-[#F7FAFE] to-[#EAF3FC] dark:from-[#090F1D] dark:via-[#0B1325] dark:to-[#090F1D]">
      <PublicHeader sessionRole={sessionUser?.roleCode ?? null} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[46rem] h-[24rem] rounded-full bg-sky-300/25 dark:bg-sky-500/10 blur-3xl"
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm clay-badge">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Media Edukasi BK Sosial untuk Siswa SMP</span>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                    Ruang Berteman,{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500 dark:from-sky-400 dark:to-cyan-300">
                      Tempat Bertumbuh
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    <strong>TEMANSPACE.ID</strong> membantu siswa SMP mengenal
                    pertemanan yang sehat, berani berkata asertif, berlatih
                    empati, dan tahu langkah aman mencari bantuan ketika
                    menghadapi konflik atau perundungan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  {sessionUser ? (
                    <Link
                      href={
                        sessionUser.roleCode === "ADMIN" ? "/admin" : "/dashboard"
                      }
                      className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base clay-btn-primary"
                    >
                      <span>Buka Dashboard Saya</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/daftar"
                        className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base clay-btn-primary"
                      >
                        <span>Daftar Akun Siswa</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3.5 text-sm sm:text-base clay-btn-secondary"
                      >
                        <span>Masuk</span>
                      </Link>
                    </>
                  )}
                  <a
                    href="#topik-edukasi"
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-200 transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Lihat Materi Edukasi</span>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2 max-w-lg">
                  <div className="clay-card p-3.5 text-center">
                    <p className="font-display text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {categories.length}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      Topik Utama
                    </p>
                  </div>
                  <div className="clay-card p-3.5 text-center">
                    <p className="font-display text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {materialCount}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      Modul Bacaan
                    </p>
                  </div>
                  <div className="clay-card p-3.5 text-center">
                    <p className="font-display text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {quizCount + scenarioCount}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      Kuis & Skenario
                    </p>
                  </div>
                </div>
              </div>

              {/* Friendly Illustration & Highlight Card */}
              <div className="lg:col-span-5">
                <div className="clay-card p-6 sm:p-8 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="clay-icon-box p-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Belajar Pertemanan yang Aman
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Terarah, interaktif, dan ramah remaja SMP
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Official TEMANSPACE.ID Brand Showcase */}
                  <div className="keep-light relative rounded-2xl bg-[#FAF6F8] border-2 border-white shadow-sm overflow-hidden mb-5 aspect-[3/2]">
                    <Image
                      src="/images/temanspace-logo.jpg"
                      alt="Logo resmi TEMANSPACE.ID — Ruang Berteman, Tempat Bertumbuh"
                      fill
                      sizes="(max-width: 1024px) 100vw, 440px"
                      className="object-contain p-2"
                      priority
                    />
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        Pendaftaran diverifikasi admin agar ruang belajar tetap aman dan tertib.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        Simulasi skenario & kuis reflektif bersifat edukatif (non-diagnostik).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        Panduan jelas menghubungi Guru BK atau orang dewasa tepercaya.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 Core Topics Navigation Grid */}
        <section id="topik-edukasi" className="py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-9">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Kurikulum Sosial Pertemanan
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  6 Topik Utama Edukasi TEMANSPACE.ID
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
                  Disusun bertahap untuk membantu siswa SMP membangun relasi
                  yang sehat, saling menghormati, dan aman.
                </p>
              </div>
              <Link
                href={sessionUser ? "/dashboard/materi" : "/daftar"}
                className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-300 hover:underline shrink-0"
              >
                <span>{sessionUser ? "Jelajahi Semua Materi" : "Daftar untuk Membaca Materi"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const targetHref = sessionUser
                  ? `/dashboard/materi/${cat.slug}`
                  : `/login?next=${encodeURIComponent(`/dashboard/materi/${cat.slug}`)}`;

                return (
                  <Link
                    key={cat.id}
                    href={targetHref}
                    className="group relative overflow-hidden clay-card clay-card-hover p-6 flex flex-col justify-between gap-4"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-transparent via-white/55 dark:via-sky-400/10 to-transparent -skew-x-12"
                    />
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="keep-light clay-icon-box p-3 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                          <StreamlineAssetIcon name={cat.iconName} className="w-7 h-7" />
                        </div>
                        <span className="clay-badge px-3 py-1 text-xs">
                          {cat._count.materials} Modul
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 pt-2">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {sessionUser ? "Buka Materi" : "Masuk untuk Membaca"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Objectives & Interactive Features */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 clay-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="clay-icon-box p-3">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Apa yang Akan Kamu Pelajari?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Tujuh keterampilan sosial utama untuk kehidupan sekolah yang nyaman
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {objectives.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {goal}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="clay-card-blue p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-bold">Kuis & Skenario Interaktif</h3>
                </div>
                <p className="text-sm text-sky-50 leading-relaxed">
                  Latih cara merespons ejekan, tekanan teman sebaya, dan
                  kesalahpahaman lewat skenario sehari-hari siswa SMP. Setiap
                  pilihan disertai penjelasan edukatif—tanpa label atau
                  penilaian psikologis.
                </p>
                <div className="mt-5">
                  <Link
                    href={sessionUser ? "/dashboard/kuis" : "/daftar"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-sky-700 font-bold text-sm shadow-sm hover:bg-sky-50 transition-colors"
                  >
                    <span>{sessionUser ? "Mulai Latihan" : "Daftar & Coba Skenario"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="clay-card p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-3">
                  <div className="clay-icon-box p-2.5">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Panduan Mencari Bantuan
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Jika kamu atau temanmu mengalami pengucilan, ancaman, atau
                  perundungan, kamu tidak harus menghadapinya sendirian.
                  TEMANSPACE.ID membantu menunjukkan langkah aman menghubungi
                  Guru BK, wali kelas, atau orang tua.
                </p>
                <div className="mt-4">
                  <Link
                    href="/tentang"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>Pelajari batasan & keamanan layanan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
