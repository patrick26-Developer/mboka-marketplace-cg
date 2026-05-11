// src/app/api/v1/shop/stats/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { ShopService } from "@/lib/services/shop.service";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "SHOP_ADMIN", "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const userId = authResult.user!.sub;

    // Récupérer la boutique du Shop Admin
    const shop = await ShopService.getShopByAdminId(userId);

    if (!shop) {
      return errorResponse("Aucune boutique assignée", 404);
    }

    const stats = await ShopService.getShopStats(shop.id);
    return successResponse({ ...stats, shop }, "Statistiques boutique récupérées");
  } catch (error) {
    console.error("[Shop Stats] Error:", error);
    return errorResponse("Erreur lors de la récupération des statistiques", 500);
  }
}