import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const auth = await requireAuth(["STUDENT", "ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const resources = await prisma.helpResource.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    resources: resources.map((r) => ({
      id: r.id,
      title: r.title,
      audienceScope: r.audienceScope,
      summary: r.summary,
      whenToReachOut: r.whenToReachOut,
      steps: JSON.parse(r.stepsJson || "[]") as string[],
      contactRole: r.contactRole,
      sortOrder: r.sortOrder,
    })),
  });
}
