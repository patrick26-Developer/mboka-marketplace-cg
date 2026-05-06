import { z } from "zod";
import { DiscountType } from "@/generated/prisma/client";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().regex(/^[A-Z0-9_-]+$/),
  description: z.string().optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().int().positive(),
  minPurchase: z.number().int().positive().optional(),
  maxDiscount: z.number().int().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  shopId: z.string().uuid().optional(),
  productIds: z.array(z.string().uuid()).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})
.refine((data) => data.endDate > data.startDate, {
  message: "La date de fin doit être après la date de début",
  path: ["endDate"],
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string(),
  shopId: z.string().uuid(),
  subtotal: z.number().int().positive(),
});