import prisma from "@/lib/prisma";
import { CreateOrderDTO, UpdateOrderStatusDTO } from "@/types";
import { OrderStatus, PaymentStatus, Prisma } from "@/generated/prisma/client";
import crypto from "crypto";

export class OrderService {
  /**
   * Génère un numéro de commande unique
   */
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `MCG-${timestamp}-${random}`;
  }

  /**
   * Créer une commande
   */
  static async createOrder(userId: string, data: CreateOrderDTO) {
    // 1. Récupérer les produits et vérifier le stock
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      include: { shop: true },
    });

    if (products.length !== data.items.length) {
      throw new Error("Certains produits sont introuvables");
    }

    // 2. Vérifier que tous les produits appartiennent à la même boutique
    const shopIds = [...new Set(products.map((p) => p.shopId))];
    if (shopIds.length > 1) {
      throw new Error("Les produits doivent appartenir à la même boutique");
    }

    const shopId = shopIds[0];

    // 3. Vérifier le stock et calculer les montants
    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      productName: string;
      productImage: string | null;
      productSku: string | null;
      price: number;
      quantity: number;
      subtotal: number;
      specifications: Prisma.InputJsonValue;
    }> = [];

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.thumbnail,
        productSku: product.sku,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        specifications: product.specifications as Prisma.InputJsonValue,
      });
    }

    // 4. Appliquer le coupon si fourni
    let discountAmount = 0;
    let couponId: string | null = null;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode },
      });

      if (coupon && coupon.isActive && coupon.startDate <= new Date() && coupon.endDate >= new Date()) {
        if (coupon.shopId && coupon.shopId !== shopId) {
          throw new Error("Ce coupon n'est pas valide pour cette boutique");
        }

        if (coupon.minPurchase && subtotal < coupon.minPurchase) {
          throw new Error(`Montant minimum de ${coupon.minPurchase} FCFA requis`);
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          throw new Error("Ce coupon a atteint sa limite d'utilisation");
        }

        // Calculer la réduction
        if (coupon.discountType === "PERCENTAGE") {
          discountAmount = Math.floor((subtotal * coupon.discountValue) / 100);
        } else {
          discountAmount = coupon.discountValue;
        }

        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }

        couponId = coupon.id;
      }
    }

    // 5. Calculer les montants finaux
    const taxAmount = 0; // À implémenter si nécessaire
    const shippingCost = 0; // À implémenter selon la logique métier
    const totalAmount = subtotal - discountAmount + taxAmount + shippingCost;

    // 6. Créer la commande
    const order = await prisma.$transaction(async (tx) => {
      // Créer la commande
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          shopId,
          subtotal,
          taxAmount,
          shippingCost,
          discountAmount,
          totalAmount,
          couponId,
          couponCode: data.couponCode,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: data.paymentMethod,
          shippingAddress: data.shippingAddress as Prisma.InputJsonValue,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          shop: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Décrémenter le stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            orderCount: { increment: 1 },
          },
        });
      }

      // Incrémenter le compteur d'utilisation du coupon
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Vider le panier
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return newOrder;
    });

    return order;
  }

  /**
   * Trouver une commande par ID
   */
  static async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, thumbnail: true, status: true },
            },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
        shop: { select: { id: true, name: true, type: true } },
        payment: true,
      },
    });
  }

  /**
   * Trouver une commande par numéro
   */
  static async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, thumbnail: true },
            },
          },
        },
        user: { select: { id: true, name: true, email: true } },
        shop: { select: { id: true, name: true, type: true } },
        payment: true,
      },
    });
  }

  /**
   * Lister les commandes d'un utilisateur
   */
  static async listUserOrders(userId: string, page = 1, limit = 10) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            select: {
              productName: true,
              productImage: true,
              quantity: true,
              price: true,
            },
          },
          shop: { select: { name: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Lister les commandes d'une boutique
   */
  static async listShopOrders(shopId: string, page = 1, limit = 20) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { shopId },
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { shopId } }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  static async updateOrderStatus(orderId: string, data: UpdateOrderStatusDTO) {
    const updateData: Prisma.OrderUpdateInput = {
      status: data.status,
      adminNote: data.adminNote,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
    };

    // Mettre à jour les timestamps selon le statut
    switch (data.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        updateData.shippedAt = new Date();
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = PaymentStatus.COMPLETED;
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        break;
      case OrderStatus.REFUNDED:
        updateData.refundedAt = new Date();
        updateData.paymentStatus = PaymentStatus.REFUNDED;
        break;
    }

    return prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Annuler une commande et restaurer le stock
   */
  static async cancelOrder(orderId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error("Commande introuvable");
      }

      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
        throw new Error("Cette commande ne peut pas être annulée");
      }

      // Restaurer le stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            orderCount: { decrement: 1 },
          },
        });
      }

      // Mettre à jour la commande
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          adminNote: reason,
        },
      });
    });
  }

  /**
   * Obtenir les statistiques d'une boutique
   */
  static async getShopStats(shopId: string) {
    const [totalOrders, totalRevenue, pendingOrders, completedOrders] = await Promise.all([
      prisma.order.count({ where: { shopId } }),
      prisma.order.aggregate({
        where: { shopId, paymentStatus: PaymentStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      prisma.order.count({ where: { shopId, status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { shopId, status: OrderStatus.DELIVERED } }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      pendingOrders,
      completedOrders,
      averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.totalAmount ?? 0) / totalOrders : 0,
    };
  }
}