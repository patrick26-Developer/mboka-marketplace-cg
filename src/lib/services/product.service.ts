import prisma from "@/lib/prisma";
import { CreateProductDTO, UpdateProductDTO, ProductFilters } from "@/types";
import { Prisma, ProductStatus } from "@/generated/prisma/client";

export class ProductService {
  /**
   * Créer un produit
   */
  static async createProduct(data: CreateProductDTO) {
    return prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice,
        costPrice: data.costPrice,
        stock: data.stock,
        sku: data.sku,
        barcode: data.barcode,
        images: data.images as unknown as Prisma.InputJsonValue,
        thumbnail: data.thumbnail,
        specifications: data.specifications as Prisma.InputJsonValue,
        shopId: data.shopId,
        categoryId: data.categoryId,
        status: data.status ?? ProductStatus.DRAFT,
        isFeatured: data.isFeatured ?? false,
        isNew: data.isNew ?? false,
      },
      include: {
        shop: true,
        category: true,
      },
    });
  }

  /**
   * Trouver un produit par ID
   */
  static async findById(id: string) {
    return prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        shop: true,
        category: true,
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  /**
   * Trouver un produit par slug
   */
  static async findBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        shop: true,
        category: true,
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  /**
   * Mettre à jour un produit
   */
  static async updateProduct(id: string, data: UpdateProductDTO) {
    return prisma.product.update({
      where: { id },
      data: data as Prisma.ProductUpdateInput,
      include: {
        shop: true,
        category: true,
      },
    });
  }

  /**
   * Supprimer un produit (soft delete)
   */
  static async deleteProduct(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ProductStatus.ARCHIVED,
      },
    });
  }

  /**
   * Lister les produits avec filtres et pagination
   */
  static async listProducts(filters: ProductFilters, page = 1, limit = 20) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (filters.shopId) {
      where.shopId = filters.shopId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters.inStock !== undefined) {
      where.stock = filters.inStock ? { gt: 0 } : { lte: 0 };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          shop: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
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
   * Incrémenter le compteur de vues
   */
  static async incrementViewCount(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Mettre à jour le stock
   */
  static async updateStock(id: string, quantity: number): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { stock: quantity },
    });
  }

  /**
   * Décrémenter le stock (lors d'une vente)
   */
  static async decrementStock(id: string, quantity: number): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { stock: true },
    });

    if (!product) {
      throw new Error("Produit introuvable");
    }

    if (product.stock < quantity) {
      throw new Error("Stock insuffisant");
    }

    await prisma.product.update({
      where: { id },
      data: {
        stock: { decrement: quantity },
        orderCount: { increment: 1 },
      },
    });
  }

  /**
   * Mettre à jour la note moyenne
   */
  static async updateAverageRating(productId: string): Promise<void> {
    const result = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: result._avg.rating ?? 0,
        reviewCount: result._count,
      },
    });
  }
}