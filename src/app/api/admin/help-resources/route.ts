import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { helpResourceSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const resources = await prisma.helpResource.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({
    resources: resources.map((r) => ({
      ...r,
      steps: JSON.parse(r.stepsJson || "[]") as string[],
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = helpResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data panduan bantuan tidak valid." },
      { status: 400 }
    );
  }

  const resource = await prisma.helpResource.create({
    data: {
      title: parsed.data.title,
      audienceScope: parsed.data.audienceScope,
      summary: parsed.data.summary,
      whenToReachOut: parsed.data.whenToReachOut,
      stepsJson: JSON.stringify(parsed.data.steps),
      contactRole: parsed.data.contactRole,
      sortOrder: parsed.data.sortOrder,
      isPublished: parsed.data.isPublished,
    },
  });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "CREATE_HELP_RESOURCE",
    targetType: "HELP_RESOURCE",
    targetId: resource.id,
    metadata: { title: resource.title, scope: resource.audienceScope },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json(
    { resource: { ...resource, steps: parsed.data.steps } },
    { status: 201 }
  );
}
