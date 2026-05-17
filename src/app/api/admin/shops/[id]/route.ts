// src/app/api/v1/admin/shops/[id]/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { ShopService } from "@/lib/services/shop.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const shop = await ShopService.getShopById(id);

    if (!shop) {
      return errorResponse("Boutique introuvable", 404);
    }

    return successResponse(shop, "Boutique récupérée");
  } catch (error) {
    console.error("[Admin Get Shop] Error:", error);
    return errorResponse("Erreur lors de la récupération", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const shop = await ShopService.updateShop(id, body);

    return successResponse(shop, "Boutique mise à jour");
  } catch (error) {
    console.error("[Admin Update Shop] Error:", error);
    return errorResponse("Erreur lors de la mise à jour", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await ShopService.deleteShop(id);
    return successResponse(null, "Boutique supprimée");
  } catch (error) {
    console.error("[Admin Delete Shop] Error:", error);
    return errorResponse("Erreur lors de la suppression", 500);
  }
}