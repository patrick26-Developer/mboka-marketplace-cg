// src/app/api/v1/auth/register/route.ts
import { prisma }                        from "@/lib/prisma";
import { hashPassword }                  from "@/lib/auth/password";
import { generateTokenPair }             from "@/lib/auth/jwt";
import { createSession, createRefreshTokenRecord, setAuthCookies,
          } from "@/lib/auth/session";
import { ACCESS_TOKEN_EXPIRES_IN_MS }     from "@/lib/auth/jwt";
import { createEmailVerificationOTP }    from "@/lib/auth/tokens";
import { sendOTPEmail }                  from "@/lib/auth/email";
import { successResponse, errorResponse, getRequestMeta } from "@/lib/utils/response";
import { logActivity }                   from "@/lib/utils/activity";
import { registerSchema }                from "@/lib/validations/auth.validation";
import { ActivityAction }                from "@/generated/prisma/client";

export async function POST(request: Request) {
  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body   = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { email, password, name, phone } = parsed.data;

    // Vérifier si email déjà utilisé
    const existing = await prisma.user.findUnique({
      where:  { email },
      select: { id: true },
    });

    if (existing) {
      return errorResponse("Cet email est déjà utilisé", 409);
    }

    // Créer l'utilisateur
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name:  name  ?? null,
        phone: phone ?? null,
        role:  "CUSTOMER",
      },
      select: {
        id:                  true,
        email:               true,
        name:                true,
        phone:               true,
        avatar:              true,
        role:                true,
        emailVerified:       true,
        isActive:            true,
        language:            true,
        currency:            true,
        timezone:            true,
        notificationsEnabled:true,
        createdAt:           true,
        lastLoginAt:         true,
      },
    });

    // Créer session + refresh token
    const now      = Date.now();
    const tokenId  = crypto.randomUUID();
    const sessionId = await createSession({
      userId:    user.id,
      token:     "",  // sera mis à jour après génération
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

    // Mettre à jour la session avec le vrai access token
    await prisma.session.update({
      where: { id: sessionId },
      data:  { token: tokens.accessToken },
    });

    // Créer le refresh token en base
    await createRefreshTokenRecord({
      userId:    user.id,
      token:     tokens.refreshToken,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    // Envoyer OTP de vérification email
    try {
      const otp = await createEmailVerificationOTP({
        userId: user.id,
        ipAddress,
        userAgent,
      });
      await sendOTPEmail(user.email, {
        name:             user.name ?? "",
        code:             otp,
        expiresInMinutes: 15,
      });
    } catch {
      console.error("[Register] Erreur envoi email OTP");
    }

    // Cookies httpOnly
    await setAuthCookies({
      accessToken:           tokens.accessToken,
      refreshToken:          tokens.refreshToken,
      accessTokenExpiresAt:  tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    });

    // Log activité
    await logActivity({
      userId:    user.id,
      action:    ActivityAction.CREATE,
      entity:    "User",
      entityId:  user.id,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    return successResponse(
      { user },
      "Compte créé avec succès. Vérifiez votre email.",
      201
    );
  } catch (err) {
    console.error("[Register]", err);
    return errorResponse("Erreur serveur", 500);
  }
}