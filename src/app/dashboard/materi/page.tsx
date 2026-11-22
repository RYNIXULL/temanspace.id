import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { StreamlineAssetIcon } from "@/components/ui/streamline-icon";

export const dynamic = "force-dynamic";

export default async function StudentMaterialsIndexPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [categories, progress] = await Promise.all([
    prisma.materialCategory.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      include: {
        materials: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            summary: true,
            readingMinutes: true,
          },
        },
      },
    }),
    prisma.materialProgress.findMany({
      where: { userId: user.id },
      select: { materialId: true },
    }),
  ]);

  const completedSet = new Set(progress.map((p) => p.materialId));

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-7">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Semua Modul Edukasi Pertemanan
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
          Pilih topik di bawah ini untuk membaca penjelasan, poin kunci, dan
          contoh situasi pertemanan sehari-hari.
        </p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <section key={cat.id} className="clay-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="keep-light clay-icon-box p-3 shrink-0">
                  <StreamlineAssetIcon name={cat.iconName} className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {cat.name}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/materi/${cat.slug}`}
                className="clay-btn-primary px-4 py-2.5 text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
              >
                <span>Pelajari Topik</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {cat.materials.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {cat.materials.map((m) => {
                  const done = completedSet.has(m.id);
                  return (
                    <Link
                      key={m.id}
                      href={`/dashboard/materi/${cat.slug}#${m.id}`}
                      className="rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 transition-colors flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Modul Bacaan</span>
                          </span>
                          {done ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sudah Dibaca</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{m.readingMinutes} menit</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1.5">
                          {m.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {m.summary}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
