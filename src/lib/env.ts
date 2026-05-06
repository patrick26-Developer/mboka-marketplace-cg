// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL:   z.string().min(1),

  // JWT
  JWT_SECRET:             z.string().min(32),
  JWT_EXPIRATION:         z.string().default("15m"),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_REFRESH_EXPIRATION: z.string().default("30d"),

  // App
  NODE_ENV:             z.enum(["development", "production", "test"]).default("development"),
  PORT:                 z.coerce.number().default(3000),
  API_PREFIX:           z.string().default("api/v1"),
  NEXT_PUBLIC_APP_URL:  z.string().min(1).default("http://localhost:3000"),
  FRONTEND_URL:         z.string().min(1),
  ADMIN_URL:            z.string().min(1),

  // Email
  SMTP_HOST:       z.string().min(1),
  SMTP_PORT:       z.coerce.number().default(587),
  SMTP_SECURE:     z.coerce.boolean().default(false),
  SMTP_USER:       z.string().email(),
  SMTP_PASS:       z.string().min(1),
  SMTP_FROM_NAME:  z.string().min(1),
  SMTP_FROM_EMAIL: z.string().email(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL:    z.string().min(1),

  // Google OAuth
  GOOGLE_CLIENT_ID:     z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL:  z.string().min(1),

  // Cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:    z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_API_KEY:       z.string().min(1),
  CLOUDINARY_API_SECRET:                z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().default("ml_default"),

  // Stripe optionnel
  STRIPE_SECRET_KEY:     z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables d'environnement invalides :");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  throw new Error("Variables d'environnement invalides. Vérifiez votre .env");
}

export const env = parsed.data;
export type Env  = z.infer<typeof envSchema>;