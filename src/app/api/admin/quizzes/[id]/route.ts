import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { quizSchema, slugify } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json(
      { error: "Kuis atau skenario tidak ditemukan." },
      { status: 404 }
    );
  }

  return NextResponse.json({ quiz });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.quiz.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Kuis atau skenario tidak ditemukan." },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = quizSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data kuis tidak valid." },
      { status: 400 }
    );
  }

  let nextSlug = existing.slug;
  if (parsed.data.slug) {
    nextSlug = slugify(parsed.data.slug);
    if (nextSlug !== existing.slug) {
      const dup = await prisma.quiz.findUnique({ where: { slug: nextSlug } });
      if (dup) {
        return NextResponse.json(
          { error: "Slug kuis sudah digunakan." },
          { status: 409 }
        );
      }
    }
  }

  const quiz = await prisma.quiz.update({
    where: { id },
    data: {
      ...(parsed.data.categoryId !== undefined
        ? { categoryId: parsed.data.categoryId }
        : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      slug: nextSlug,
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.sortOrder !== undefined
        ? { sortOrder: parsed.data.sortOrder }
        : {}),
      ...(parsed.data.isPublished !== undefined
        ? { isPublished: parsed.data.isPublished }
        : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: quiz.type === "SCENARIO" ? "UPDATE_SCENARIO" : "UPDATE_QUIZ",
    targetType: "QUIZ",
    targetId: id,
    metadata: { title: quiz.title, isPublished: quiz.isPublished },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ quiz });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.quiz.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Kuis atau skenario tidak ditemukan." },
      { status: 404 }
    );
  }

  await prisma.quiz.delete({ where: { id } });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: existing.type === "SCENARIO" ? "DELETE_SCENARIO" : "DELETE_QUIZ",
    targetType: "QUIZ",
    targetId: id,
    metadata: { title: existing.title },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Kuis atau skenario berhasil dihapus." });
}
