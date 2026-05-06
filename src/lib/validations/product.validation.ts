import { z } from "zod";
import { ProductStatus } from "@/generated/prisma/client";

// ✅ AJOUTÉ : Schéma pour les images de produits
const productImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Minimum 3 caractères").max(500, "Maximum 500 caractères"),
  slug: z.string().min(3, "Minimum 3 caractères").max(500, "Maximum 500 caractères"),
  description: z.string().optional(),
  price: z.number().int().positive("Le prix doit être positif"),
  comparePrice: z.number().int().positive().optional(),
  costPrice: z.number().int().positive().optional(),
  stock: z.number().int().min(0, "Le stock ne peut pas être négatif"),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  images: z.array(productImageSchema).max(10).optional(), // ✅ CORRIGÉ
  thumbnail: z.string().url().optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  shopId: z.string().uuid(),
  categoryId: z.string().uuid(),
  status: z.nativeEnum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({
  shopId: true,
});

export const productFiltersSchema = z.object({
  shopId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  isFeatured: z.boolean().optional(),
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),
  search: z.string().optional(),
  inStock: z.boolean().optional(),
});