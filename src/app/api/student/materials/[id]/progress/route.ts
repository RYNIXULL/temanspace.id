import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const material = await prisma.material.findFirst({
    where: { id, isPublished: true },
    select: { id: true },
  });

  if (!material) {
    return NextResponse.json(
      { error: "Materi tidak ditemukan." },
      { status: 404 }
    );
  }

  const record = await prisma.materialProgress.upsert({
    where: {
      userId_materialId: {
        userId: auth.user.id,
        materialId: material.id,
      },
    },
    update: { completedAt: new Date() },
    create: {
      userId: auth.user.id,
      materialId: material.id,
    },
  });

  return NextResponse.json({ progress: record });
}
