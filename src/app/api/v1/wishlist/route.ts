// src/app/api/v1/wishlist/route.ts
import { authenticate } from "@/lib/guards/auth.guard";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { z } from "zod";

const createSchema = z.object({
  productId: z.string().uuid("ID produit invalide"),
  notifyOnPriceChange: z.boolean().optional().default(false),
  notifyOnRestock: z.boolean().optional().default(false),
});

export async function GET(request: Request): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const items = await prisma.wishlistItem.findMany({
      where: { userId: user!.sub },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            stock: true,
            thumbnail: true,
            status: true,
            shop: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(items);
  } catch (err: unknown) {
    console.error("[Wishlist GET]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const body: unknown = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Données invalides",
        400,
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { productId, notifyOnPriceChange, notifyOnRestock } = parsed.data;

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      return errorResponse("Produit introuvable", 404);
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: user!.sub,
          productId,
        },
      },
      create: {
        userId: user!.sub,
        productId,
        notifyOnPriceChange,
        notifyOnRestock,
      },
      update: {
        notifyOnPriceChange,
        notifyOnRestock,
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

    return successResponse(item, "Ajouté à la wishlist", 201);
  } catch (err: unknown) {
    console.error("[Wishlist POST]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const productId: string | null = searchParams.get("productId");

    if (!productId) {
      return errorResponse("productId requis en paramètre", 400);
    }

    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user!.sub,
          productId,
        },
      },
      select: { id: true },
    });

    if (!item) {
      return errorResponse("Article introuvable dans la wishlist", 404);
    }

    await prisma.wishlistItem.delete({
      where: { id: item.id },
    });

    return successResponse(null, "Retiré de la wishlist");
  } catch (err: unknown) {
    console.error("[Wishlist DELETE]", err);
    const message: string = err instanceof Error ? err.message : "Erreur serveur";
    return errorResponse(message, 500);
  }
}