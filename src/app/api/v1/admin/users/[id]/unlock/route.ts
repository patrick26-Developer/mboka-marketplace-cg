// src/app/api/v1/admin/users/[id]/unlock/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { UserService } from "@/lib/services/user.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await UserService.unlockAccount(id);
    return successResponse(null, "Compte déverrouillé");
  } catch (error) {
    console.error("[Admin Unlock User] Error:", error);
    return errorResponse("Erreur lors du déverrouillage", 500);
  }
}