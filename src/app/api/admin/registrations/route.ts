import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status")?.trim();
  const validStatus =
    statusParam === "pending" ||
    statusParam === "approved" ||
    statusParam === "rejected"
      ? statusParam
      : undefined;

  const registrations = await prisma.registrationRequest.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          gradeLevel: true,
          status: true,
          createdAt: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ registrations });
}
