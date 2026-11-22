import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { materialSchema, slugify } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Materi tidak ditemukan." },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = materialSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data materi tidak valid." },
      { status: 400 }
    );
  }

  if (parsed.data.categoryId) {
    const category = await prisma.materialCategory.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Kategori materi tidak ditemukan." },
        { status: 400 }
      );
    }
  }

  let nextSlug = existing.slug;
  if (parsed.data.slug) {
    nextSlug = slugify(parsed.data.slug);
    if (nextSlug !== existing.slug) {
      const dup = await prisma.material.findUnique({ where: { slug: nextSlug } });
      if (dup) {
        return NextResponse.json(
          { error: "Slug materi sudah digunakan." },
          { status: 409 }
        );
      }
    }
  }

  const material = await prisma.material.update({
    where: { id },
    data: {
      ...(parsed.data.categoryId !== undefined
        ? { categoryId: parsed.data.categoryId }
        : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      slug: nextSlug,
      ...(parsed.data.summary !== undefined
        ? { summary: parsed.data.summary }
        : {}),
      ...(parsed.data.content !== undefined
        ? { content: parsed.data.content }
        : {}),
      ...(parsed.data.keyPoints !== undefined
        ? { keyPointsJson: JSON.stringify(parsed.data.keyPoints) }
        : {}),
      ...(parsed.data.examples !== undefined
        ? { examplesJson: JSON.stringify(parsed.data.examples) }
        : {}),
      ...(parsed.data.readingMinutes !== undefined
        ? { readingMinutes: parsed.data.readingMinutes }
        : {}),
      ...(parsed.data.sortOrder !== undefined
        ? { sortOrder: parsed.data.sortOrder }
        : {}),
      ...(parsed.data.isPublished !== undefined
        ? { isPublished: parsed.data.isPublished }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "UPDATE_MATERIAL",
    targetType: "MATERIAL",
    targetId: id,
    metadata: { title: material.title, isPublished: material.isPublished },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    material: {
      ...material,
      keyPoints: JSON.parse(material.keyPointsJson || "[]") as string[],
      examples: JSON.parse(material.examplesJson || "[]"),
    },
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Materi tidak ditemukan." },
      { status: 404 }
    );
  }

  await prisma.material.delete({ where: { id } });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "DELETE_MATERIAL",
    targetType: "MATERIAL",
    targetId: id,
    metadata: { title: existing.title },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Materi berhasil dihapus." });
}
