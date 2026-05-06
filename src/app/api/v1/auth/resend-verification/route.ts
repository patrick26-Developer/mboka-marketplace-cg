// src/app/api/v1/auth/resend-verification/route.ts
import { prisma }                      from "@/lib/prisma";
import { createEmailVerificationOTP }  from "@/lib/auth/tokens";
import { sendOTPEmail }                from "@/lib/auth/email";
import { successResponse, errorResponse, getRequestMeta } from "@/lib/utils/response";
import { z }                           from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body   = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Email invalide", 400);
    }

    const user = await prisma.user.findUnique({
      where:  { email: parsed.data.email },
      select: { id: true, name: true, emailVerified: true, isActive: true },
    });

    // Réponse générique pour éviter l'énumération d'emails
    if (!user || !user.isActive) {
      return successResponse(null, "Si cet email existe, un code a été envoyé.");
    }

    if (user.emailVerified) {
      return errorResponse("Email déjà vérifié", 400);
    }

    const otp = await createEmailVerificationOTP({
      userId: user.id,
      ipAddress,
      userAgent,
    });

    await sendOTPEmail(parsed.data.email, {
      name:             user.name ?? "",
      code:             otp,
      expiresInMinutes: 15,
    });

    return successResponse(null, "Code de vérification envoyé.");
  } catch (err) {
    console.error("[ResendVerification]", err);
    return errorResponse("Erreur serveur", 500);
  }
}