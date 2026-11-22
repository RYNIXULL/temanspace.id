import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  HelpCircle,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { StreamlineAssetIcon } from "@/components/ui/streamline-icon";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [categories, totalMaterials, completedProgress, quizzes, attempts] =
    await Promise.all([
      prisma.materialCategory.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        include: {
          materials: {
            where: { isPublished: true },
            select: { id: true },
          },
        },
      }),
      prisma.material.count({ where: { isPublished: true } }),
      prisma.materialProgress.findMany({
        where: { userId: user.id },
        select: { materialId: true },
      }),
      prisma.quiz.findMany({
        where: { isPublished: true },
        select: { id: true, type: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
        take: 4,
        include: {
          quiz: { select: { id: true, title: true, type: true } },
        },
      }),
    ]);

  const completedSet = new Set(completedProgress.map((p) => p.materialId));
  const progressPct =
    totalMaterials > 0
      ? Math.round((completedSet.size / totalMaterials) * 100)
      : 0;

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <section className="clay-card-blue p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-100">
            Dashboard Edukasi Siswa
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Halo, {user.fullName}
          </h1>
          <p className="text-sm text-sky-50 leading-relaxed">
            Selamat datang di ruang belajarmu. Pelajari cara membangun
            pertemanan sehat, berkomunikasi asertif, dan menjaga rasa aman di
            sekolah dengan ritmemu sendiri.
          </p>
        </div>

        <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 p-4 min-w-[200px] w-full md:w-auto">
          <p className="text-xs font-bold text-sky-50">Progres Bacaan</p>
          <p className="font-display text-3xl font-bold mt-1">
            {completedSet.size} / {totalMaterials}
          </p>
          <div className="w-full h-2.5 bg-white/30 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-sky-50 mt-1.5">
            {progressPct}% modul selesai dibaca
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="clay-card p-5 flex items-center gap-4">
          <div className="clay-icon-box p-3">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Topik Edukasi
            </p>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {categories.length} Topik
            </p>
          </div>
        </div>

        <div className="clay-card p-5 flex items-center gap-4">
          <div className="clay-icon-box p-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Kuis & Skenario
            </p>
            <p className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {quizzes.length} Latihan
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/bantuan"
          className="clay-card clay-card-hover p-5 flex items-center gap-4 group"
        >
          <div className="clay-icon-box p-3 text-rose-500">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Butuh Dukungan?
            </p>
            <p className="font-display text-base font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
              Panduan Mencari Bantuan
            </p>
          </div>
        </Link>
      </section>

      {/* Topic Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Topik Pembelajaran
          </h2>
          <Link
            href="/dashboard/materi"
            className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((cat) => {
            const totalInCat = cat.materials.length;
            const doneInCat = cat.materials.filter((m) =>
              completedSet.has(m.id)
            ).length;

            return (
              <Link
                key={cat.id}
                href={`/dashboard/materi/${cat.slug}`}
                className="group clay-card clay-card-hover p-5 flex items-start gap-4"
              >
                <div className="keep-light clay-icon-box p-3 shrink-0 transition-transform duration-300 group-hover:-rotate-6">
                  <StreamlineAssetIcon name={cat.iconName} className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 shrink-0">
                      {doneInCat}/{totalInCat}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Practice + Safety Reminder */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Riwayat Kuis & Skenario Terakhir
            </h2>
            <Link
              href="/dashboard/kuis"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Kerjakan Latihan
            </Link>
          </div>

          {attempts.length === 0 ? (
            <div className="rounded-2xl bg-sky-50/70 dark:bg-slate-800/70 p-5 text-sm text-slate-600 dark:text-slate-300">
              Kamu belum mencoba kuis atau skenario interaktif. Mulai latihan
              pertamamu di menu <strong>Kuis dan Skenario</strong>.
            </div>
          ) : (
            <div className="space-y-2.5">
              {attempts.map((att) => (
                <Link
                  key={att.id}
                  href={`/dashboard/kuis/${att.quiz.id}`}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {att.quiz.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {att.quiz.type === "SCENARIO" ? "Skenario" : "Kuis"} •{" "}
                        {att.recommendedCount} dari {att.totalQuestions} pilihan tepat
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 clay-card p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="clay-icon-box p-2.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pengingat Ruang Aman
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Materi dan kuis di TEMANSPACE.ID bertujuan membantu refleksi dan
            pembelajaran sosial, bukan untuk menilai atau mendiagnosis kondisi
            psikologis.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Jika kamu mengalami pengucilan, ancaman, atau perundungan, segera
            hubungi Guru BK, wali kelas, atau orang tua.
          </p>
          <Link
            href="/dashboard/bantuan"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm clay-btn-secondary mt-1"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Buka Panduan Bantuan</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
