// src/app/api/v1/auth/login/route.ts
import { prisma }               from "@/lib/prisma";
import { verifyPassword }       from "@/lib/auth/password";
import { generateTokenPair }    from "@/lib/auth/jwt";
import { createSession, createRefreshTokenRecord, setAuthCookies} from "@/lib/auth/session";
import { ACCESS_TOKEN_EXPIRES_IN_MS } from "@/lib/auth/jwt";
import { successResponse, errorResponse, getRequestMeta } from "@/lib/utils/response";
import { logActivity }          from "@/lib/utils/activity";
import { loginSchema }          from "@/lib/validations/auth.validation";
import { ActivityAction }       from "@/generated/prisma/client";

const MAX_FAILED_ATTEMPTS = 5;

export async function POST(request: Request) {
  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body   = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Email ou mot de passe invalide", 400);
    }

    const { email, password } = parsed.data;

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where:  { email },
      select: {
        id: true, email: true, name: true, phone: true,
        avatar: true, role: true, emailVerified: true,
        isActive: true, isLocked: true, passwordHash: true,
        failedLoginCount: true, language: true, currency: true,
        timezone: true, notificationsEnabled: true,
        createdAt: true, lastLoginAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      return errorResponse("Email ou mot de passe incorrect", 401);
    }

    // Compte verrouillé ?
    if (user.isLocked) {
      return errorResponse("Votre compte est verrouillé. Contactez le support.", 403);
    }

    // Compte inactif ?
    if (!user.isActive) {
      return errorResponse("Votre compte est désactivé.", 403);
    }

    // Vérifier mot de passe
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const newCount = user.failedLoginCount + 1;
      const shouldLock = newCount >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount:  newCount,
          lastFailedLoginAt: new Date(),
          isLocked:          shouldLock,
          lockedAt:          shouldLock ? new Date() : undefined,
          lockedReason:      shouldLock ? "Trop de tentatives échouées" : undefined,
        },
      });

      await logActivity({
        userId:   user.id,
        action:   ActivityAction.LOGIN_FAILED,
        entity:   "User",
        entityId: user.id,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      });

      if (shouldLock) {
        return errorResponse("Compte verrouillé après trop de tentatives.", 403);
      }

      return errorResponse(
        `Email ou mot de passe incorrect. (${MAX_FAILED_ATTEMPTS - newCount} tentatives restantes)`,
        401
      );
    }

    // ✅ Connexion réussie — réinitialiser compteur
    const now       = Date.now();
    const tokenId   = crypto.randomUUID();
    const sessionId = await createSession({
      userId:    user.id,
      token:     "",
      expiresAt: new Date(now + ACCESS_TOKEN_EXPIRES_IN_MS),
      ipAddress,
      userAgent,
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

    await createRefreshTokenRecord({
      userId:    user.id,
      token:     tokens.refreshToken,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lastLoginAt:      new Date(),
      },
    });

    await setAuthCookies({
      accessToken:           tokens.accessToken,
      refreshToken:          tokens.refreshToken,
      accessTokenExpiresAt:  tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    });

    await logActivity({
      userId:    user.id,
      action:    ActivityAction.LOGIN_SUCCESS,
      entity:    "User",
      entityId:  user.id,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    const { passwordHash: _, isLocked: __, failedLoginCount: ___, ...publicUser } = user;

    return successResponse({ user: publicUser }, "Connexion réussie");
  } catch (err) {
    console.error("[Login]", err);
    return errorResponse("Erreur serveur", 500);
  }
}