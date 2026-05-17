// src/app/api/v1/auth/refresh/route.ts
import { cookies }           from "next/headers";
import { prisma }            from "@/lib/prisma";
import { verifyRefreshToken, generateTokenPair } from "@/lib/auth/jwt";
import { createSession, setAuthCookies,
         COOKIE_REFRESH_TOKEN } from "@/lib/auth/session";
         import { ACCESS_TOKEN_EXPIRES_IN_MS } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function POST(request: Request) {
  try {
    const cookieStore  = await cookies();
    const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

    if (!refreshToken) {
      return errorResponse("Refresh token manquant", 401);
    }

    // Vérifier JWT
    const payload = await verifyRefreshToken(refreshToken);

    // Vérifier en base
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      select: { id: true, isRevoked: true, expiresAt: true, userId: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      return errorResponse("Session expirée, reconnectez-vous", 401);
    }

    // Charger l'utilisateur
    const user = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, isLocked: true },
    });

    if (!user || !user.isActive || user.isLocked) {
      return errorResponse("Compte inaccessible", 403);
    }

    // Révoquer l'ancien refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data:  { isRevoked: true, revokedAt: new Date() },
    });

    // Créer nouvelle session
    const now       = Date.now();
    const tokenId   = crypto.randomUUID();
    const sessionId = await createSession({
      userId:    user.id,
      token:     "",
      expiresAt: new Date(now + ACCESS_TOKEN_EXPIRES_IN_MS),
    });

    const tokens = await generateTokenPair({
      userId:    user.id,
      email:     user.email,
      role:      user.role,
      sessionId,
      tokenId,
    });

    await prisma.session.update({
      where: { id: sessionId },
      data:  { token: tokens.accessToken },
    });

    await prisma.refreshToken.create({
      data: {
        userId:    user.id,
        token:     tokens.refreshToken,
        expiresAt: tokens.refreshTokenExpiresAt,
      },
    });

    await setAuthCookies({
      accessToken:           tokens.accessToken,
      refreshToken:          tokens.refreshToken,
      accessTokenExpiresAt:  tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    });

    return successResponse(null, "Token rafraîchi");
  } catch (err) {
    console.error("[Refresh]", err);
    return errorResponse("Session invalide, reconnectez-vous", 401);
  }
}