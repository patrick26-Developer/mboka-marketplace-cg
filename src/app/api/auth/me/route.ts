// src/app/api/v1/auth/me/route.ts
import { prisma }            from "@/lib/prisma";
import { authenticate }      from "@/lib/guards/auth.guard";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const dbUser = await prisma.user.findUnique({
      where: { id: user!.sub },
      select: {
        id:                   true,
        email:                true,
        name:                 true,
        phone:                true,
        avatar:               true,
        role:                 true,
        emailVerified:        true,
        isActive:             true,
        language:             true,
        currency:             true,
        timezone:             true,
        notificationsEnabled: true,
        createdAt:            true,
        lastLoginAt:          true,
      },
    });

    if (!dbUser) {
      return errorResponse("Utilisateur introuvable", 404);
    }

    return successResponse(dbUser, "Profil récupéré");
  } catch (err) {
    console.error("[Me]", err);
    return errorResponse("Erreur serveur", 500);
  }
}