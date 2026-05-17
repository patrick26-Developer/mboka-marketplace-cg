// src/app/api/v1/admin/users/route.ts
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { requireRole } from "@/lib/guards/auth.guard";
import { UserService } from "@/lib/services/user.service";
import { UserRole } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      role: searchParams.get("role") as UserRole | undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      emailVerified: searchParams.get("emailVerified")
        ? searchParams.get("emailVerified") === "true"
        : undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const result = await UserService.listUsers(filters, page, limit);
    return successResponse(result, "Utilisateurs récupérés");
  } catch (error) {
    console.error("[Admin Users List] Error:", error);
    return errorResponse("Erreur lors de la récupération des utilisateurs", 500);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, "SUPER_ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const body: unknown = await request.json();

    // Validation de type runtime
    if (
      !body ||
      typeof body !== "object" ||
      !("email" in body) ||
      !("role" in body)
    ) {
      return errorResponse("Email et rôle requis", 400);
    }

    const data = body as {
      email: string;
      password?: string;
      name?: string;
      phone?: string;
      role: UserRole;
      emailVerified?: boolean;
    };

    if (data.role === "SHOP_ADMIN" && !data.password) {
      return errorResponse("Mot de passe requis pour créer un Shop Admin", 400);
    }

    const user = await UserService.createUser(data);
    return successResponse(user, "Utilisateur créé avec succès", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[Admin Create User] Error:", message);
    return errorResponse(message, 500);
  }
}