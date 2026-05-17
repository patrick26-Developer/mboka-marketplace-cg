// src/app/api/v1/cart/route.ts
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/guards/auth.guard";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const items = await prisma.cartItem.findMany({
      where: { userId: user!.sub },
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
            shop: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const subtotal = items.reduce(
      (total, item) => total + item.priceSnapshot * item.quantity,
      0
    );

    return successResponse({
      items,
      subtotal,
      itemsCount: items.reduce((count, item) => count + item.quantity, 0),
    });
  } catch (err) {
    console.error("[Cart GET]", err);
    return errorResponse("Erreur serveur", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (error) return error;

    const { productId, quantity } = await request.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, stock: true, shopId: true },
    });

    if (!product) {
      return errorResponse("Produit introuvable", 404);
    }

    if (product.stock < quantity) {
      return errorResponse("Stock insuffisant", 400);
    }

    // Vérifier conflit boutique
    const existingItems = await prisma.cartItem.findMany({
      where: { userId: user!.sub },
      include: { product: { select: { shopId: true } } },
    });

    if (
      existingItems.length > 0 &&
      existingItems[0].product.shopId !== product.shopId
    ) {
      return errorResponse(
        "Votre panier contient des articles d'une autre boutique",
        400
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user!.sub,
          productId,
        },
      },
      create: {
        userId: user!.sub,
        productId,
        quantity,
        priceSnapshot: product.price,
      },
      update: {
        quantity: { increment: quantity },
        priceSnapshot: product.price,
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

    return successResponse(cartItem, "Produit ajouté au panier", 201);
  } catch (err) {
    console.error("[Cart POST]", err);
    return errorResponse("Erreur serveur", 500);
  }
}