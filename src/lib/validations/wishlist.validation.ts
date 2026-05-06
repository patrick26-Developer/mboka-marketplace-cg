import { z } from "zod";

export const addToWishlistSchema = z.object({
  productId: z.string().uuid(),
  notifyOnPriceChange: z.boolean().optional().default(false),
  notifyOnRestock: z.boolean().optional().default(false),
});

export const updateWishlistItemSchema = z.object({
  notifyOnPriceChange: z.boolean().optional(),
  notifyOnRestock: z.boolean().optional(),
});