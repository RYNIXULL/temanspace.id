import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { StreamlineAssetIcon } from "@/components/ui/streamline-icon";
import { MaterialReader } from "@/components/student/material-reader";

export const dynamic = "force-dynamic";

export default async function StudentCategoryMaterialsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  const category = await prisma.materialCategory.findFirst({
    where: { slug, isPublished: true },
    include: {
      materials: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
      },
      quizzes: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true, type: true },
      },
    },
  });

  if (!category) {
    notFound();
  }

  const progress = await prisma.materialProgress.findMany({
    where: {
      userId: user.id,
      materialId: { in: category.materials.map((m) => m.id) },
    },
    select: { materialId: true },
  });
  const completedSet = new Set(progress.map((p) => p.materialId));

  const viewMaterials = category.materials.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    summary: m.summary,
    content: m.content,
    keyPoints: JSON.parse(m.keyPointsJson || "[]") as string[],
    examples: JSON.parse(m.examplesJson || "[]") as Array<{
      situation: string;
      response: string;
    }>,
    readingMinutes: m.readingMinutes,
    isCompleted: completedSet.has(m.id),
  }));

  return (
    <div className="space-y-6">
      <div className="clay-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="keep-light clay-icon-box p-3.5 shrink-0">
            <StreamlineAssetIcon name={category.iconName} className="w-8 h-8" />
          </div>
          <div>
            <Link
              href="/dashboard/materi"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Semua Topik</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {category.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      <MaterialReader
        materials={viewMaterials}
        showAssertiveBuilder={category.slug === "komunikasi-asertif"}
      />

      {category.quizzes.length > 0 && (
        <div className="clay-card-blue p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-100">
              Latihan Terkait Topik Ini
            </p>
            <p className="text-lg font-bold mt-0.5">
              {category.quizzes[0].title}
            </p>
          </div>
          <Link
            href={`/dashboard/kuis/${category.quizzes[0].id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-sky-700 font-bold text-sm hover:bg-sky-50 transition-colors shrink-0"
          >
            <span>Mulai Latihan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
