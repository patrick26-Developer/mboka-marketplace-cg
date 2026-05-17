// src/app/api/v1/products/[slug]/route.ts
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        shop: true,
        category: true,
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return errorResponse("Produit introuvable", 404);
    }

    // Incrémenter vues
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return successResponse(product);
  } catch (err) {
    console.error("[Product GET]", err);
    return errorResponse("Erreur serveur", 500);
  }
}