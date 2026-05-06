import { z } from "zod";
import { AddressType } from "@/generated/prisma/client";

export const createAddressSchema = z.object({
  type: z.nativeEnum(AddressType).default("BOTH"),
  fullName: z.string().min(2, "Minimum 2 caractères"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Numéro invalide"),
  street: z.string().min(5, "Minimum 5 caractères"),
  city: z.string().min(2, "Minimum 2 caractères"),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("Congo-Brazzaville"),
  instructions: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();