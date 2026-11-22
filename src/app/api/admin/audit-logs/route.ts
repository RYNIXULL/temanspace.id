import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get("action")?.trim();
  const limitParam = Number(searchParams.get("limit") ?? "100");
  const take =
    Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 300
      ? limitParam
      : 100;

  const logs = await prisma.auditLog.findMany({
    where: actionFilter ? { action: actionFilter } : undefined,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  return NextResponse.json({ logs });
}
