import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { materialSchema, slugify } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const materials = await prisma.material.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({
    materials: materials.map((m) => ({
      ...m,
      keyPoints: JSON.parse(m.keyPointsJson || "[]") as string[],
      examples: JSON.parse(m.examplesJson || "[]") as Array<{
        situation: string;
        response: string;
      }>,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data materi tidak valid." },
      { status: 400 }
    );
  }

  const category = await prisma.materialCategory.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category) {
    return NextResponse.json(
      { error: "Kategori materi tidak ditemukan." },
      { status: 400 }
    );
  }

  const baseSlug = parsed.data.slug || slugify(parsed.data.title);
  let slug = baseSlug;
  const existing = await prisma.material.findUnique({ where: { slug } });
  if (existing) {
    slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const material = await prisma.material.create({
    data: {
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      content: parsed.data.content,
      keyPointsJson: JSON.stringify(parsed.data.keyPoints),
      examplesJson: JSON.stringify(parsed.data.examples),
      readingMinutes: parsed.data.readingMinutes,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
      createdById: auth.user.id,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "CREATE_MATERIAL",
    targetType: "MATERIAL",
    targetId: material.id,
    metadata: { title: material.title, categoryId: material.categoryId },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json(
    {
      material: {
        ...material,
        keyPoints: parsed.data.keyPoints,
        examples: parsed.data.examples,
      },
    },
    { status: 201 }
  );
}
