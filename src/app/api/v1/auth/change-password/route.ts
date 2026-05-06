// src/app/api/v1/auth/change-password/route.ts
import { prisma }               from "@/lib/prisma";
import { hashPassword,
         verifyPassword }       from "@/lib/auth/password";
import { authenticate }         from "@/lib/guards/auth.guard";
import { sendPasswordChangedEmail } from "@/lib/auth/email";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { logActivity }          from "@/lib/utils/activity";
import { ActivityAction }       from "@/generated/prisma/client";
import { z }                    from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path:    ["confirmPassword"],
});

export async function POST(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const body   = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where:  { id: user!.sub },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!dbUser?.passwordHash) {
      return errorResponse(
        "Impossible de changer le mot de passe d'un compte Google",
        400
      );
    }

    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return errorResponse("Mot de passe actuel incorrect", 401);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: dbUser.id },
      data:  { passwordHash: newHash },
    });

    await sendPasswordChangedEmail(dbUser.email, {
      name:       dbUser.name ?? "",
      changeDate: new Date().toLocaleDateString("fr-CG"),
    });

    await logActivity({
      userId:   dbUser.id,
      action:   ActivityAction.PASSWORD_CHANGE,
      entity:   "User",
      entityId: dbUser.id,
    });

    return successResponse(null, "Mot de passe modifié avec succès");
  } catch (err) {
    console.error("[ChangePassword]", err);
    return errorResponse("Erreur serveur", 500);
  }
}