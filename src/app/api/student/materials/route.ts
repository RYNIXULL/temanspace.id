import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category")?.trim();

  const [categories, materials, progress] = await Promise.all([
    prisma.materialCategory.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.material.findMany({
      where: {
        isPublished: true,
        category: {
          isPublished: true,
          ...(categorySlug ? { slug: categorySlug } : {}),
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: {
        category: { select: { id: true, slug: true, name: true, iconName: true } },
      },
    }),
    prisma.materialProgress.findMany({
      where: { userId: auth.user.id },
      select: { materialId: true, completedAt: true },
    }),
  ]);

  const completedMap = new Map(
    progress.map((p) => [p.materialId, p.completedAt])
  );

  return NextResponse.json({
    categories,
    materials: materials.map((m) => ({
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
      sortOrder: m.sortOrder,
      category: m.category,
      completedAt: completedMap.get(m.id) ?? null,
    })),
  });
}
