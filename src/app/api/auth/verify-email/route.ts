// src/app/api/v1/auth/verify-email/route.ts
import { prisma }            from "@/lib/prisma";
import { verifyEmailOTP }    from "@/lib/auth/tokens";
import { authenticate }      from "@/lib/guards/auth.guard";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { logActivity }       from "@/lib/utils/activity";
import { ActivityAction }    from "@/generated/prisma/client";
import { z }                 from "zod";

const schema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const body   = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Code invalide (6 chiffres requis)", 400);
    }

    const result = await verifyEmailOTP({
      userId: user!.sub,
      code:   parsed.data.code,
    });

    if (!result.valid) {
      return errorResponse(result.message, 400);
    }

    await logActivity({
      userId:   user!.sub,
      action:   ActivityAction.EMAIL_VERIFIED,
      entity:   "User",
      entityId: user!.sub,
    });

    return successResponse(null, result.message);
  } catch (err) {
    console.error("[VerifyEmail]", err);
    return errorResponse("Erreur serveur", 500);
  }
}