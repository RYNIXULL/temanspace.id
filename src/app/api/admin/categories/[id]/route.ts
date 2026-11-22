import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { categorySchema, slugify } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.materialCategory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Kategori tidak ditemukan." },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data kategori tidak valid." },
      { status: 400 }
    );
  }

  const nextSlug =
    parsed.data.slug ??
    (parsed.data.name ? slugify(parsed.data.name) : existing.slug);
  if (nextSlug !== existing.slug) {
    const duplicate = await prisma.materialCategory.findUnique({
      where: { slug: nextSlug },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Slug kategori sudah digunakan." },
        { status: 409 }
      );
    }
  }

  const category = await prisma.materialCategory.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      slug: nextSlug,
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      ...(parsed.data.iconName !== undefined
        ? { iconName: parsed.data.iconName }
        : {}),
      ...(parsed.data.sortOrder !== undefined
        ? { sortOrder: parsed.data.sortOrder }
        : {}),
      ...(parsed.data.isPublished !== undefined
        ? { isPublished: parsed.data.isPublished }
        : {}),
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "UPDATE_CATEGORY",
    targetType: "MATERIAL_CATEGORY",
    targetId: id,
    metadata: { name: category.name, slug: category.slug },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ category });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.materialCategory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Kategori tidak ditemukan." },
      { status: 404 }
    );
  }

  await prisma.materialCategory.delete({ where: { id } });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "DELETE_CATEGORY",
    targetType: "MATERIAL_CATEGORY",
    targetId: id,
    metadata: { name: existing.name, slug: existing.slug },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Kategori berhasil dihapus." });
}
