// src/lib/services/admin.service.ts
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/client";

export class AdminService {
  /**
   * Statistiques globales Super Admin
   */
  static async getGlobalStats() {
    const [
      totalUsers,
      totalShops,
      totalOrders,
      totalRevenue,
      lastMonthUsers,
      lastMonthOrders,
      lastMonthRevenue,
    ] = await Promise.all([
      // Total utilisateurs
      prisma.user.count({
        where: { deletedAt: null },
      }),

      // Total boutiques
      prisma.shop.count({
        where: { deletedAt: null },
      }),

      // Total commandes
      prisma.order.count(),

      // Chiffre d'affaires total
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),

      // Nouveaux users mois dernier (pour trend)
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      }),

      // Commandes mois dernier
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      }),

      // CA mois dernier
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.COMPLETED,
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Calculer trends (comparaison mois actuel vs mois dernier)
    const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2));
    const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1));

    const [previousMonthUsers, previousMonthOrders, previousMonthRevenue] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.COMPLETED,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
        _sum: { totalAmount: true },
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
      totalUsers,
      totalShops,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      trends: {
        users: calculateTrend(lastMonthUsers, previousMonthUsers),
        orders: calculateTrend(lastMonthOrders, previousMonthOrders),
        revenue: calculateTrend(
          lastMonthRevenue._sum.totalAmount ?? 0,
          previousMonthRevenue._sum.totalAmount ?? 0
        ),
      },
    };
  }

  /**
   * Commandes récentes (toutes boutiques)
   */
  static async getRecentOrders(limit = 10) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            type: true,
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
   * Analytics par boutique
   */
  static async getShopAnalytics() {
    const shops = await prisma.shop.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    const shopsWithRevenue = await Promise.all(
      shops.map(async (shop) => {
        const revenue = await prisma.order.aggregate({
          where: {
            shopId: shop.id,
            paymentStatus: PaymentStatus.COMPLETED,
          },
          _sum: { totalAmount: true },
        });

        return {
          ...shop,
          totalRevenue: revenue._sum.totalAmount ?? 0,
        };
      })
    );

    return shopsWithRevenue;
  }

  /**
   * Utilisateurs récents
   */
  static async getRecentUsers(limit = 10) {
    return prisma.user.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });
  }
}