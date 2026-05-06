import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(), // Optionnel pour OAuth
  name: z.string().min(2).max(255).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  role: z.nativeEnum(UserRole),
  emailVerified: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: z.string().url().optional(),
  language: z.enum(["fr", "en"]).optional(),
  timezone: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const userFiltersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});