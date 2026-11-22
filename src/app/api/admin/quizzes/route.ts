import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { quizSchema, slugify } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type")?.trim();
  const validType =
    typeParam === "QUIZ" || typeParam === "SCENARIO" ? typeParam : undefined;

  const quizzes = await prisma.quiz.findMany({
    where: validType ? { type: validType } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return NextResponse.json({ quizzes });
}

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data kuis tidak valid." },
      { status: 400 }
    );
  }

  const baseSlug = parsed.data.slug || slugify(parsed.data.title);
  let slug = baseSlug;
  const dup = await prisma.quiz.findUnique({ where: { slug } });
  if (dup) {
    slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const quiz = await prisma.quiz.create({
    data: {
      categoryId: parsed.data.categoryId || null,
      title: parsed.data.title,
      slug,
      description: parsed.data.description,
      type: parsed.data.type,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
      createdById: auth.user.id,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: parsed.data.type === "SCENARIO" ? "CREATE_SCENARIO" : "CREATE_QUIZ",
    targetType: "QUIZ",
    targetId: quiz.id,
    metadata: { title: quiz.title, type: quiz.type },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
