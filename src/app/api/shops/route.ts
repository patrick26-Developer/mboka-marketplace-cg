// src/app/api/v1/shops/route.ts
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        logo: true,
        banner: true,
        description: true,
        _count: {
          select: {
            products: { where: { status: "ACTIVE", deletedAt: null } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(shops);
  } catch (err) {
    console.error("[Shops GET]", err);
    return errorResponse("Erreur serveur", 500);
  }
}