// src/lib/services/shop.service.ts
import { prisma } from "@/lib/prisma";
import { PaymentStatus, ProductStatus, ShopType } from "@/generated/prisma/client";

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

/**
 * Lister toutes les boutiques (Admin)
 */
static async listAllShops(page = 1, limit = 20) {
  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        type: true,
        slug: true,
        logo: true,
        banner: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.shop.count({ where: { deletedAt: null } }),
  ]);

  return {
    shops,
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
 * Créer une boutique (Super Admin)
 */
static async createShop(data: {
  name: string;
  type: ShopType;
  slug: string;
  adminId: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone?: string;
}) {
  // Vérifier que le Shop Admin existe et a le bon rôle
  const admin = await prisma.user.findUnique({
    where: { id: data.adminId },
    select: { role: true, shops: { select: { id: true } } },
  });

  if (!admin) {
    throw new Error("Utilisateur introuvable");
  }

  if (admin.role !== "SHOP_ADMIN") {
    throw new Error("L'utilisateur doit avoir le rôle SHOP_ADMIN");
  }

  if (admin.shops.length > 0) {
    throw new Error("Ce Shop Admin gère déjà une boutique");
  }

  // Vérifier que le type n'est pas déjà pris
  const existingShop = await prisma.shop.findFirst({
    where: { type: data.type, deletedAt: null },
  });

  if (existingShop) {
    throw new Error(`Une boutique ${data.type} existe déjà`);
  }

  return prisma.shop.create({
    data: {
      name: data.name,
      type: data.type,
      slug: data.slug,
      adminId: data.adminId,
      description: data.description,
      logo: data.logo,
      banner: data.banner,
      email: data.email,
      phone: data.phone,
      isActive: true,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Mettre à jour une boutique
 */
static async updateShop(
  shopId: string,
  data: {
    name?: string;
    description?: string;
    logo?: string;
    banner?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
  }
) {
  return prisma.shop.update({
    where: { id: shopId },
    data,
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Supprimer une boutique (soft delete)
 */
static async deleteShop(shopId: string) {
  return prisma.shop.update({
    where: { id: shopId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
}

/**
 * Récupérer une boutique par ID
 */
static async getShopById(shopId: string) {
  return prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          products: true,
          orders: true,
          categories: true,
        },
      },
    },
  });
}
}