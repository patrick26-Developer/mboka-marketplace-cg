// src/app/api/v1/auth/forgot-password/route.ts
import { prisma }                    from "@/lib/prisma";
import { createPasswordResetToken }  from "@/lib/auth/tokens";
import { sendPasswordResetEmail }    from "@/lib/auth/email";
import { successResponse, errorResponse, getRequestMeta } from "@/lib/utils/response";
import { logActivity }               from "@/lib/utils/activity";
import { ActivityAction }            from "@/generated/prisma/client";
import { z }                         from "zod";

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
      select: { id: true, name: true, isActive: true, passwordHash: true },
    });

    // Toujours répondre pareil (sécurité anti-énumération)
    const MSG = "Si cet email existe, un lien de réinitialisation a été envoyé.";

    if (!user || !user.isActive || !user.passwordHash) {
      return successResponse(null, MSG);
    }

    const token     = await createPasswordResetToken({ userId: user.id, ipAddress, userAgent });
    const resetUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    await sendPasswordResetEmail(parsed.data.email, {
      name:     user.name ?? "",
      resetUrl,
    });

    await logActivity({
      userId:    user.id,
      action:    ActivityAction.PASSWORD_RESET_REQUEST,
      entity:    "User",
      entityId:  user.id,
      ipAddress: ipAddress ?? undefined,
    });

    return successResponse(null, MSG);
  } catch (err) {
    console.error("[ForgotPassword]", err);
    return errorResponse("Erreur serveur", 500);
  }
}