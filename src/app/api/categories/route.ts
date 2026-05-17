// src/app/api/v1/categories/route.ts
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return errorResponse("shopId requis", 400);
    }

    const categories = await prisma.category.findMany({
      where: {
        shopId,
        isActive: true,
        deletedAt: null,
        parentId: null, // Seulement catégories racines
      },
      include: {
        children: {
          where: { isActive: true, deletedAt: null },
        },
        _count: {
          select: {
            products: { where: { status: "ACTIVE", deletedAt: null } },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return successResponse(categories);
  } catch (err) {
    console.error("[Categories GET]", err);
    return errorResponse("Erreur serveur", 500);
  }
}