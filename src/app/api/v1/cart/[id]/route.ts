// src/app/api/v1/cart/[id]/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { z } from "zod";

const patchSchema = z.object({
  quantity: z.number().int().positive("Quantité invalide").max(99, "Maximum 99 unités"),
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
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Quantité invalide",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { quantity } = parsed.data;

    const item = await prisma.cartItem.findFirst({
      where: { id, userId: user!.sub },
      select: {
        id: true,
        product: {
          select: {
            stock: true,
            price: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      return errorResponse("Article introuvable", 404);
    }

    if (quantity > item.product.stock) {
      return errorResponse(
        `Stock insuffisant. Disponible : ${item.product.stock}`,
        400
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: {
        quantity,
        priceSnapshot: item.product.price,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            thumbnail: true,
            status: true,
          },
        },
      },
    });

    return successResponse(updated, "Quantité mise à jour");
  } catch (err: unknown) {
    console.error("[Cart PATCH]", err);
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

    const item = await prisma.cartItem.findFirst({
      where: { id, userId: user!.sub },
      select: { id: true },
    });

    if (!item) {
      return errorResponse("Article introuvable", 404);
    }

    await prisma.cartItem.delete({ where: { id } });

    return successResponse(null, "Article retiré du panier");
  } catch (err: unknown) {
    console.error("[Cart DELETE]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}