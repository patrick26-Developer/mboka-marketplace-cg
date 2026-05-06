// src/lib/validations/order.validation.ts
import { z } from "zod";
import { PaymentMethod, OrderStatus } from "@/generated/prisma/client";

export const createOrderSchema = z.object({
  // ✅ AJOUTÉ — le client envoie le shopId
  shopId: z.string().uuid("ID boutique invalide"),

  items: z
    .array(
      z.object({
        productId: z.string().uuid("ID produit invalide"),
        quantity: z.number().int().positive("Quantité invalide"),
      })
    )
    .min(1, "Au moins un produit requis"),

  shippingAddress: z.object({
    fullName: z.string().min(2, "Nom trop court"),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Numéro invalide"),
    street: z.string().min(5, "Adresse trop courte"),
    city: z.string().min(2, "Ville requise"),
    region: z.string().optional(),
    country: z.string().default("Congo-Brazzaville"),
    instructions: z.string().optional(),
  }),

  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().max(50).optional(),
  customerNote: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  adminNote: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional(),
  estimatedDelivery: z.coerce.date().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;