import { z } from "zod";
import { ShopType } from "@/generated/prisma/client";

export const createShopSchema = z.object({
  name: z.string().min(3, "Minimum 3 caractères").max(255, "Maximum 255 caractères"),
  type: z.nativeEnum(ShopType),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, "Slug invalide (a-z, 0-9, -)"),
  settings: z.record(z.string(), z.unknown()).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
});

export const updateShopSchema = createShopSchema.partial().omit({
  type: true,
  slug: true,
});

export const shopFiltersSchema = z.object({
  type: z.nativeEnum(ShopType).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});