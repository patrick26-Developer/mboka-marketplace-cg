import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères").max(255, "Maximum 255 caractères"),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  icon: z.string().max(100).optional(),
  image: z.string().url().optional(),
  shopId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  order: z.number().int().min(0).optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().omit({
  shopId: true,
});

export const categoryFiltersSchema = z.object({
  shopId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
});