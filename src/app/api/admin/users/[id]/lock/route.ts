// src/app/api/v1/admin/users/[id]/lock/route.ts
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
    const body = await request.json();
    const reason: string = body.reason ?? "Verrouillé par l'administrateur";

    await UserService.lockAccount(id, reason);
    return successResponse(null, "Compte verrouillé");
  } catch (error) {
    console.error("[Admin Lock User] Error:", error);
    return errorResponse("Erreur lors du verrouillage", 500);
  }
}