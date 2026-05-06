// src/app/api/v1/reviews/route.ts
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/guards/auth.guard";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { ReviewService } from "@/lib/services/review.service";
import { createReviewSchema } from "@/lib/validations/review.validation";

export async function POST(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as any
      );
    }

    const review = await ReviewService.createReview(user!.sub, parsed.data);

    return successResponse(review, "Avis publié avec succès", 201);
  } catch (err: any) {
    console.error("[Reviews POST]", err);
    return errorResponse(err.message || "Erreur serveur", 500);
  }
}