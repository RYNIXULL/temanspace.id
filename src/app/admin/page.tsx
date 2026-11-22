import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  HelpCircle,
  LifeBuoy,
  MessageSquareHeart,
  ScrollText,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user || user.roleCode !== "ADMIN") redirect("/login");

  const [
    pendingCount,
    approvedCount,
    suspendedCount,
    rejectedCount,
    categoryCount,
    materialCount,
    quizCount,
    scenarioCount,
    helpCount,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "pending" },
    }),
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "approved" },
    }),
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "suspended" },
    }),
    prisma.user.count({
      where: { role: { code: "STUDENT" }, status: "rejected" },
    }),
    prisma.materialCategory.count(),
    prisma.material.count(),
    prisma.quiz.count({ where: { type: "QUIZ" } }),
    prisma.quiz.count({ where: { type: "SCENARIO" } }),
    prisma.helpResource.count(),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  const statCards = [
    {
      label: "Menunggu Persetujuan",
      value: pendingCount,
      href: "/admin/persetujuan",
      icon: ClipboardCheck,
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Siswa Aktif (Approved)",
      value: approvedCount,
      href: "/admin/siswa",
      icon: Users,
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Materi Edukasi",
      value: materialCount,
      href: "/admin/materi",
      icon: BookOpen,
      accent: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Kategori Materi",
      value: categoryCount,
      href: "/admin/kategori",
      icon: FolderKanban,
      accent: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Kuis Edukatif",
      value: quizCount,
      href: "/admin/kuis",
      icon: HelpCircle,
      accent: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Skenario Interaktif",
      value: scenarioCount,
      href: "/admin/skenario",
      icon: MessageSquareHeart,
      accent: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Panduan Bantuan",
      value: helpCount,
      href: "/admin/bantuan",
      icon: LifeBuoy,
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Ditangguhkan / Ditolak",
      value: suspendedCount + rejectedCount,
      href: "/admin/siswa",
      icon: Users,
      accent: "text-slate-600 dark:text-slate-300",
    },
  ];

  return (
    <div className="space-y-7">
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Ringkasan Tata Kelola
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            Dashboard Admin TEMANSPACE.ID
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Pantau permohonan pendaftaran siswa, kelola materi edukasi, kuis,
            skenario, serta panduan mencari bantuan.
          </p>
        </div>

        {pendingCount > 0 && (
          <Link
            href="/admin/persetujuan"
            className="clay-btn-primary px-5 py-3 text-sm inline-flex items-center gap-2 shrink-0"
          >
            <span>Tinjau {pendingCount} Pendaftaran</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="clay-card clay-card-hover p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className={`clay-icon-box p-2.5 ${card.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {card.value}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                  {card.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="clay-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Aktivitas Audit Terbaru
            </h2>
          </div>
          <Link
            href="/admin/audit-log"
            className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Lihat Semua Log
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada catatan aktivitas.</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs sm:text-sm"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-sky-700 dark:text-sky-300 mr-2">
                    {log.action}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    oleh {log.actor?.fullName || "Sistem"} ({log.targetType})
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
