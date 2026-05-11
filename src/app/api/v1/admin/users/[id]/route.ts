// src/app/api/v1/admin/users/[id]/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { UserService } from "@/lib/services/user.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const user = await UserService.getUserById(id);

    if (!user) {
      return errorResponse("Utilisateur introuvable", 404);
    }

    return successResponse(user, "Utilisateur récupéré");
  } catch (error) {
    console.error("[Admin Get User] Error:", error);
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
    const user = await UserService.updateUser(id, body);

    return successResponse(user, "Utilisateur mis à jour");
  } catch (error) {
    console.error("[Admin Update User] Error:", error);
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
    await UserService.deleteUser(id);
    return successResponse(null, "Utilisateur supprimé");
  } catch (error) {
    console.error("[Admin Delete User] Error:", error);
    return errorResponse("Erreur lors de la suppression", 500);
  }
}