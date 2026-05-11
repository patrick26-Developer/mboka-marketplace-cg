// src/app/api/v1/admin/stats/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { AdminService } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const stats = await AdminService.getGlobalStats();
    return successResponse(stats, "Statistiques récupérées");
  } catch (error) {
    console.error("[Admin Stats] Error:", error);
    return errorResponse("Erreur lors de la récupération des statistiques", 500);
  }
}