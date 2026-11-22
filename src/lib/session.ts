import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "temanspace_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type RoleCode = "ADMIN" | "STUDENT";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  gradeLevel: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  roleCode: RoleCode;
  roleName: string;
}

function getJwtSecret(): Uint8Array {
  const raw = process.env.AUTH_SESSION_SECRET;
  if (!raw || raw.trim().length < 16) {
    throw new Error(
      "AUTH_SESSION_SECRET belum dikonfigurasi dengan benar (minimal 16 karakter)."
    );
  }
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(payload: {
  userId: string;
  roleCode: RoleCode;
}): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    role: payload.roleCode,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: string; roleCode: RoleCode } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const roleCode =
      payload.role === "ADMIN" || payload.role === "STUDENT"
        ? payload.role
        : null;
    if (!userId || !roleCode) return null;
    return { userId, roleCode };
  } catch {
    return null;
  }
}

export function attachSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export function clearSessionCookieOnResponse(
  response: NextResponse
): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * Always re-validates user existence, role, and live status from database.
 * Pending, rejected, and suspended users are never considered authenticated.
 */
export async function getSessionUser(
  tokenOverride?: string | null
): Promise<SessionUser | null> {
  let token = tokenOverride ?? null;
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  }
  if (!token) return null;

  const verified = await verifySessionToken(token);
  if (!verified) return null;

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    include: { role: true },
  });

  if (!user || user.status !== "approved") {
    return null;
  }

  const roleCode = user.role.code === "ADMIN" ? "ADMIN" : "STUDENT";
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    gradeLevel: user.gradeLevel,
    status: user.status,
    roleCode,
    roleName: user.role.name,
  };
}

export async function requireAuth(
  allowedRoles?: RoleCode[]
): Promise<
  | { user: SessionUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          error:
            "Sesi tidak ditemukan, sudah kedaluwarsa, atau akun Anda tidak aktif.",
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.roleCode)) {
    return {
      errorResponse: NextResponse.json(
        { error: "Anda tidak memiliki izin untuk mengakses fitur ini." },
        { status: 403 }
      ),
    };
  }

  return { user };
}
