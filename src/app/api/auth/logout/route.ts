// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  clearAuthCookies,
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
} from "@/lib/auth/session";
import { successResponse } from "@/lib/utils/response";
import { logActivity } from "@/lib/utils/activity";
import { ActivityAction } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
    const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

    if (accessToken) {
      try {
        const payload = await verifyAccessToken(accessToken);

        // ✅ SUPPRIMER session (Better Auth n'a pas isRevoked)
        await prisma.session.deleteMany({
          where: { token: accessToken },
        });

        // ✅ Révoquer refresh token (votre table custom a bien isRevoked)
        if (refreshToken) {
          await prisma.refreshToken.updateMany({
            where: { token: refreshToken, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
          });
        }

        await logActivity({
          userId: payload.sub,
          action: ActivityAction.LOGOUT,
          entity: "User",
          entityId: payload.sub,
        });
      } catch {
        // Token déjà expiré — on nettoie quand même
      }
    }

    await clearAuthCookies();
    return successResponse(null, "Déconnexion réussie");
  } catch (err) {
    console.error("[Logout]", err);
    // On nettoie les cookies même en cas d'erreur
    await clearAuthCookies();
    return successResponse(null, "Déconnexion réussie");
  }
}