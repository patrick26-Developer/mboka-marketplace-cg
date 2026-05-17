// src/app/api/v1/admin/shops/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { ShopService } from "@/lib/services/shop.service";
import { ShopType } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get("page")  ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const result = await ShopService.listAllShops(page, limit);
    return successResponse(result, "Boutiques récupérées");
  } catch (error) {
    console.error("[Admin Shops GET] Error:", error);
    return errorResponse("Erreur lors de la récupération", 500);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("name" in body) ||
      !("type" in body) ||
      !("slug" in body) ||
      !("adminId" in body)
    ) {
      return errorResponse("name, type, slug et adminId sont requis", 400);
    }

    const data = body as {
      name:         string;
      type:         ShopType;
      slug:         string;
      adminId:      string;
      description?: string;
      logo?:        string;
      banner?:      string;
      email?:       string;
      phone?:       string;
    };

    const shop = await ShopService.createShop(data);
    return successResponse(shop, "Boutique créée avec succès", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[Admin Shops POST] Error:", message);
    return errorResponse(message, 500);
  }
}