import prisma from "@/lib/prisma";
import { CreateReviewDTO } from "@/types";
import { Prisma } from "@/generated/prisma/client";

export class ReviewService {
  /**
   * Créer un avis
   */
  static async createReview(userId: string, data: CreateReviewDTO) {
    // Vérifier que l'utilisateur a acheté le produit
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: {
          userId,
          status: "DELIVERED",
        },
      },
    });

    if (!hasPurchased) {
      throw new Error("Vous devez avoir acheté ce produit pour laisser un avis");
    }

    // Vérifier qu'il n'a pas déjà laissé un avis
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: data.productId,
        },
      },
    });

    if (existingReview) {
      throw new Error("Vous avez déjà laissé un avis pour ce produit");
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        images: data.images as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Mettre à jour la note moyenne du produit
    await this.updateProductRating(data.productId);

    return review;
  }

  /**
   * Lister les avis d'un produit
   */
  static async listProductReviews(productId: string, page = 1, limit = 10) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          isApproved: true,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({
        where: {
          productId,
          isApproved: true,
          deletedAt: null,
        },
      }),
    ]);

    return {
      reviews,
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
   * Approuver un avis
   */
  static async approveReview(reviewId: string, approvedBy: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
      },
    });

    await this.updateProductRating(review.productId);

    return review;
  }

  /**
   * Rejeter un avis
   */
  static async rejectReview(reviewId: string, reason: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data: {
        isApproved: false,
        rejectedAt: new Date(),
        rejectReason: reason,
      },
    });
  }

  /**
   * Supprimer un avis
   */
  static async deleteReview(reviewId: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.updateProductRating(review.productId);
  }

  /**
   * Mettre à jour la note moyenne d'un produit
   */
  private static async updateProductRating(productId: string) {
    const result = await prisma.review.aggregate({
      where: {
        productId,
        isApproved: true,
        deletedAt: null,
      },
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

  /**
   * Marquer un avis comme utile
   */
  static async markAsHelpful(reviewId: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
      },
    });
  }

  /**
   * Marquer un avis comme non utile
   */
  static async markAsUnhelpful(reviewId: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data: {
        unhelpfulCount: { increment: 1 },
      },
    });
  }
}