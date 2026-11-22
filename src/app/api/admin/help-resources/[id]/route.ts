import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { helpResourceSchema } from "@/lib/validators";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["ADMIN"]);
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await context.params;
  const existing = await prisma.helpResource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Panduan bantuan tidak ditemukan." },
      { status: 404 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = helpResourceSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data panduan bantuan tidak valid." },
      { status: 400 }
    );
  }

  const resource = await prisma.helpResource.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.audienceScope !== undefined
        ? { audienceScope: parsed.data.audienceScope }
        : {}),
      ...(parsed.data.summary !== undefined
        ? { summary: parsed.data.summary }
        : {}),
      ...(parsed.data.whenToReachOut !== undefined
        ? { whenToReachOut: parsed.data.whenToReachOut }
        : {}),
      ...(parsed.data.steps !== undefined
        ? { stepsJson: JSON.stringify(parsed.data.steps) }
        : {}),
      ...(parsed.data.contactRole !== undefined
        ? { contactRole: parsed.data.contactRole }
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
    action: "UPDATE_HELP_RESOURCE",
    targetType: "HELP_RESOURCE",
    targetId: id,
    metadata: { title: resource.title },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({
    resource: {
      ...resource,
      steps: JSON.parse(resource.stepsJson || "[]") as string[],
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
  const existing = await prisma.helpResource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Panduan bantuan tidak ditemukan." },
      { status: 404 }
    );
  }

  await prisma.helpResource.delete({ where: { id } });

  await recordAuditLog({
    actorUserId: auth.user.id,
    action: "DELETE_HELP_RESOURCE",
    targetType: "HELP_RESOURCE",
    targetId: id,
    metadata: { title: existing.title },
    ipAddress: extractClientIp(request.headers),
  });

  return NextResponse.json({ message: "Panduan bantuan berhasil dihapus." });
}
