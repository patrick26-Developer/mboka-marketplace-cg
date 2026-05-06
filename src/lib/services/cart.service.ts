import prisma from "@/lib/prisma";
import { AddToCartDTO, UpdateCartItemDTO } from "@/types";

export class CartService {
  /**
   * Ajouter un produit au panier
   */
  static async addToCart(userId: string, data: AddToCartDTO) {
    // Vérifier que le produit existe et est disponible
    const product = await prisma.product.findUnique({
      where: { id: data.productId, deletedAt: null },
    });

    if (!product) {
      throw new Error("Produit introuvable");
    }

    if (product.stock < data.quantity) {
      throw new Error("Stock insuffisant");
    }

    // Vérifier si le produit est déjà dans le panier
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: data.productId,
        },
      },
    });

    if (existingItem) {
      // Mettre à jour la quantité
      const newQuantity = existingItem.quantity + data.quantity;

      if (newQuantity > product.stock) {
        throw new Error("Stock insuffisant");
      }

      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
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
    }

    // Ajouter au panier
    return prisma.cartItem.create({
      data: {
        userId,
        productId: data.productId,
        quantity: data.quantity,
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
  }

  /**
   * Récupérer le panier d'un utilisateur
   */
  static async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
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
            shop: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const subtotal = items.reduce((total, item) => {
      return total + item.priceSnapshot * item.quantity;
    }, 0);

    return {
      items,
      subtotal,
      itemsCount: items.reduce((count, item) => count + item.quantity, 0),
    };
  }

  /**
   * Mettre à jour un article du panier
   */
  static async updateCartItem(cartItemId: string, data: UpdateCartItemDTO) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!cartItem) {
      throw new Error("Article introuvable dans le panier");
    }

    if (data.quantity > cartItem.product.stock) {
      throw new Error("Stock insuffisant");
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity: data.quantity,
        priceSnapshot: cartItem.product.price,
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
  }

  /**
   * Supprimer un article du panier
   */
  static async removeFromCart(cartItemId: string): Promise<void> {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  /**
   * Vider le panier
   */
  static async clearCart(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  /**
   * Synchroniser le panier (mettre à jour les prix)
   */
  static async syncCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    await Promise.all(
      items.map((item) =>
        prisma.cartItem.update({
          where: { id: item.id },
          data: {
            priceSnapshot: item.product.price,
          },
        })
      )
    );

    return this.getCart(userId);
  }
}