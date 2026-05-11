// src/lib/services/shop.service.ts
import { prisma } from "@/lib/prisma";
import { PaymentStatus, ProductStatus } from "@/generated/prisma/client";

export class ShopService {
  /**
   * Récupérer la boutique assignée au Shop Admin
   */
  static async getShopByAdminId(adminId: string) {
    return prisma.shop.findFirst({
      where: {
        adminId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        type: true,
        logo: true,
        isActive: true,
      },
    });
  }

  /**
   * Statistiques boutique spécifique
   */
  static async getShopStats(shopId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      monthOrders,
      lastMonthOrders,
      monthRevenue,
      lastMonthRevenue,
      totalReviews,
    ] = await Promise.all([
      // Total produits
      prisma.product.count({
        where: { shopId, deletedAt: null },
      }),

      // Produits actifs
      prisma.product.count({
        where: {
          shopId,
          deletedAt: null,
          status: ProductStatus.ACTIVE,
        },
      }),

      // Produits stock bas
      prisma.product.count({
        where: {
          shopId,
          deletedAt: null,
          stock: { lte: prisma.product.fields.lowStockAlert },
        },
      }),

      // Total commandes
      prisma.order.count({
        where: { shopId },
      }),

      // Commandes mois en cours
      prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Commandes mois dernier
      prisma.order.count({
        where: {
          shopId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // CA mois en cours
      prisma.order.aggregate({
        where: {
          shopId,
          paymentStatus: PaymentStatus.COMPLETED,
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),

      // CA mois dernier
      prisma.order.aggregate({
        where: {
          shopId,
          paymentStatus: PaymentStatus.COMPLETED,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { totalAmount: true },
      }),

      // Total avis
      prisma.review.count({
        where: {
          product: { shopId },
          isApproved: true,
        },
      }),
    ]);

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { value: 100, isPositive: true };
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(Math.round(change)),
        isPositive: change >= 0,
      };
    };

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      monthRevenue: monthRevenue._sum.totalAmount ?? 0,
      totalReviews,
      trends: {
        orders: calculateTrend(monthOrders, lastMonthOrders),
        revenue: calculateTrend(
          monthRevenue._sum.totalAmount ?? 0,
          lastMonthRevenue._sum.totalAmount ?? 0
        ),
      },
    };
  }

  /**
   * Alertes stock bas
   */
  static async getLowStockAlerts(shopId: string, limit = 10) {
    const products = await prisma.product.findMany({
      where: {
        shopId,
        deletedAt: null,
        status: ProductStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true,
        thumbnail: true,
        sku: true,
      },
      orderBy: { stock: "asc" },
    });

    return products.filter((p) => p.stock <= p.lowStockAlert).slice(0, limit);
  }

  /**
   * Produits best-sellers
   */
  static async getBestSellers(shopId: string, limit = 10) {
    return prisma.product.findMany({
      where: {
        shopId,
        deletedAt: null,
        orderCount: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnail: true,
        price: true,
        orderCount: true,
        stock: true,
      },
      orderBy: { orderCount: "desc" },
      take: limit,
    });
  }

  /**
   * Commandes récentes boutique
   */
  static async getShopRecentOrders(shopId: string, limit = 10) {
    return prisma.order.findMany({
      where: { shopId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            productName: true,
            quantity: true,
            price: true,
          },
        },
      },
    });
  }

  /**
   * Graphique ventes 6 derniers mois
   */
  static async getSalesChart(shopId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const orders = await prisma.order.findMany({
      where: {
        shopId,
        paymentStatus: PaymentStatus.COMPLETED,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Grouper par mois
    const monthlyData = new Map<string, number>();

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
      monthlyData.set(key, 0);
    }

    orders.forEach((order) => {
      const key = new Date(order.createdAt).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      if (monthlyData.has(key)) {
        monthlyData.set(key, (monthlyData.get(key) ?? 0) + order.totalAmount);
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse();
  }
}