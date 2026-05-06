// src/lib/auth/session.ts
import { prisma }      from "@/lib/prisma";
import { cookies }     from "next/headers";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt";
import type { Prisma } from "@/generated/prisma/client"; // ✅ import Prisma types

export const COOKIE_ACCESS_TOKEN  = "mcg_access_token";
export const COOKIE_REFRESH_TOKEN = "mcg_refresh_token";

// ============================================================
// CRÉER SESSION
// ============================================================

export async function createSession(params: {
  userId:     string;
  token:      string;
  expiresAt:  Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId:    params.userId,
      token:     params.token,
      expiresAt: params.expiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
    select: { id: true },
  });
  return session.id;
}

// ============================================================
// CRÉER REFRESH TOKEN EN BASE
// ============================================================

export async function createRefreshTokenRecord(params: {
  userId:      string;
  token:       string;
  expiresAt:   Date;
  deviceInfo?: Prisma.InputJsonValue | null; // ✅ Type Prisma correct pour JsonB
}): Promise<string> {
  const record = await prisma.refreshToken.create({
    data: {
      userId:     params.userId,
      token:      params.token,
      expiresAt:  params.expiresAt,
      // ✅ Prisma accepte undefined pour omettre le champ
      ...(params.deviceInfo !== null && params.deviceInfo !== undefined
        ? { deviceInfo: params.deviceInfo }
        : {}),
    },
    select: { id: true },
  });
  return record.id;
}

// ============================================================
// RÉVOQUER SESSION
// ============================================================

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data:  { isRevoked: true, revokedAt: new Date() },
  });
}

// ============================================================
// RÉVOQUER REFRESH TOKEN
// ============================================================

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { id: tokenId },
    data:  { isRevoked: true, revokedAt: new Date() },
  });
}

// ============================================================
// RÉVOQUER TOUTES LES SESSIONS (logout all devices)
// ============================================================

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const now = new Date();
  await Promise.all([
    prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data:  { isRevoked: true, revokedAt: now },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data:  { isRevoked: true, revokedAt: now },
    }),
  ]);
}

// ============================================================
// LIRE L'UTILISATEUR COURANT (Server Components / Route Handlers)
// ============================================================

export async function getCurrentUser(): Promise<AccessTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token       = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
    if (!token) return null;

    const payload = await verifyAccessToken(token);

    const session = await prisma.session.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!session) return null;
    return payload;
  } catch {
    return null;
  }
}

// ============================================================
// SETTER COOKIES
// ============================================================

export async function setAuthCookies(params: {
  accessToken:           string;
  refreshToken:          string;
  accessTokenExpiresAt:  Date;
  refreshTokenExpiresAt: Date;
}): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_ACCESS_TOKEN, params.accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    expires:  params.accessTokenExpiresAt,
  });

  cookieStore.set(COOKIE_REFRESH_TOKEN, params.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/api/auth/refresh",
    expires:  params.refreshTokenExpiresAt,
  });
}

// ============================================================
// SUPPRIMER COOKIES (logout)
// ============================================================

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
}