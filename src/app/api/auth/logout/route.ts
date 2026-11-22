import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse, getSessionUser } from "@/lib/session";
import { extractClientIp, recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (user) {
    await recordAuditLog({
      actorUserId: user.id,
      action: "USER_LOGOUT",
      targetType: "USER",
      targetId: user.id,
      ipAddress: extractClientIp(request.headers),
    });
  }

  const response = NextResponse.json({ message: "Logout berhasil." });
  return clearSessionCookieOnResponse(response);
}
