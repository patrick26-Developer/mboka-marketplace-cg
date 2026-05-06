// src/app/api/v1/addresses/[id]/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { z } from "zod";

const updateSchema = z.object({
  type: z.enum(["BILLING", "SHIPPING", "BOTH"]).optional(),
  fullName: z.string().min(2).max(255).optional(),
  phoneNumber: z.string().min(8).max(20).optional(),
  street: z.string().min(5).max(500).optional(),
  city: z.string().min(2).max(100).optional(),
  region: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  country: z.string().max(100).optional(),
  instructions: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const address = await prisma.address.findFirst({
      where: { id, userId: user!.sub, deletedAt: null },
      select: { id: true },
    });

    if (!address) {
      return errorResponse("Adresse introuvable", 404);
    }

    const { isDefault, ...updateData } = parsed.data;

    // Si isDefault passe à true, retirer le défaut des autres
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: user!.sub, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...updateData,
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return successResponse(updated, "Adresse mise à jour");
  } catch (err: unknown) {
    console.error("[Addresses PATCH]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { id } = await params;

    const address = await prisma.address.findFirst({
      where: { id, userId: user!.sub, deletedAt: null },
      select: { id: true, isDefault: true },
    });

    if (!address) {
      return errorResponse("Adresse introuvable", 404);
    }

    // Soft delete
    await prisma.address.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });

    return successResponse(null, "Adresse supprimée");
  } catch (err: unknown) {
    console.error("[Addresses DELETE]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}