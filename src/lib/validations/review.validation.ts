import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1, "Minimum 1 étoile").max(5, "Maximum 5 étoiles"),
  comment: z.string().min(10, "Minimum 10 caractères").max(2000, "Maximum 2000 caractères").optional(),
  images: z.array(z.string().url()).max(5, "Maximum 5 images").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export const reviewFiltersSchema = z.object({
  productId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isApproved: z.boolean().optional(),
});