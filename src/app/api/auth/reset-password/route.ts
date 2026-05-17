// src/app/api/v1/auth/reset-password/route.ts
import { prisma }                      from "@/lib/prisma";
import { hashPassword }                from "@/lib/auth/password";
import { verifyPasswordResetToken,
         consumePasswordResetToken }   from "@/lib/auth/tokens";
import { sendPasswordChangedEmail }    from "@/lib/auth/email";
import { revokeAllUserSessions }       from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { logActivity }                 from "@/lib/utils/activity";
import { ActivityAction }              from "@/generated/prisma/client";
import { z }                           from "zod";

const schema = z.object({
  token:           z.string().min(1),
  newPassword:     z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path:    ["confirmPassword"],
});

export async function POST(request: Request) {
  try {
    const body   = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { token, newPassword } = parsed.data;

    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid || !verification.userId) {
      return errorResponse(verification.message, 400);
    }

    const user = await prisma.user.findUnique({
      where:  { id: verification.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return errorResponse("Utilisateur introuvable", 404);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, failedLoginCount: 0, isLocked: false },
    });

    await consumePasswordResetToken(token);
    await revokeAllUserSessions(user.id);

    await sendPasswordChangedEmail(user.email, {
      name:       user.name ?? "",
      changeDate: new Date().toLocaleDateString("fr-CG"),
    });

    await logActivity({
      userId:   user.id,
      action:   ActivityAction.PASSWORD_RESET_SUCCESS,
      entity:   "User",
      entityId: user.id,
    });

    return successResponse(null, "Mot de passe réinitialisé. Reconnectez-vous.");
  } catch (err) {
    console.error("[ResetPassword]", err);
    return errorResponse("Erreur serveur", 500);
  }
}