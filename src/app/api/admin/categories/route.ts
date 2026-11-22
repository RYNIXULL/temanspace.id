import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { categorySchema, slugify } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const categories = await prisma.materialCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { materials: true, quizzes: true },
      },
    },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data kategori tidak valid." },
      { status: 400 }
    );
  }

  const slug = parsed.data.slug || slugify(parsed.data.name);
  const existing = await prisma.materialCategory.findUnique({
    where: { slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Slug kategori sudah digunakan." },
      { status: 409 }
    );
  }

  const category = await prisma.materialCategory.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      iconName: parsed.data.iconName,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "CREATE_CATEGORY",
    targetType: "MATERIAL_CATEGORY",
    targetId: category.id,
    metadata: { name: category.name, slug: category.slug },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ category }, { status: 201 });
}
