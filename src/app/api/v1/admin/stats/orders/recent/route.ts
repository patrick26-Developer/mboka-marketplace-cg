// src/app/api/v1/admin/orders/recent/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { AdminService } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const orders = await AdminService.getRecentOrders(limit);
    return successResponse(orders, "Commandes récentes récupérées");
  } catch (error) {
    console.error("[Admin Recent Orders] Error:", error);
    return errorResponse("Erreur lors de la récupération des commandes", 500);
  }
}