import { z } from "zod";

// ============================================================
// BASE SCHEMAS
// ============================================================

export const emailSchema = z
  .string({ message: "Email requis" })
  .email("Format d'email invalide")
  .min(5, "Email trop court")
  .max(255, "Email trop long")
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string({ message: "Mot de passe requis" })
  .min(8, "Minimum 8 caractères")
  .max(100, "Maximum 100 caractères")
  .regex(/[A-Z]/, "Au moins une majuscule requise")
  .regex(/[a-z]/, "Au moins une minuscule requise")
  .regex(/[0-9]/, "Au moins un chiffre requis")
  .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial requis (!@#$%^&*)");

// ✅ CORRIGÉ : Regex plus permissive pour les numéros congolais
export const phoneSchema = z
  .string()
  .regex(
    /^(\+?[1-9]\d{0,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{0,9}$/,
    "Numéro de téléphone invalide"
  )
  .optional()
  .or(z.literal(""));

export const nameSchema = z
  .string()
  .min(2, "Minimum 2 caractères")
  .max(255, "Maximum 255 caractères")
  .trim()
  .optional()
  .or(z.literal(""));

export const otpCodeSchema = z
  .string()
  .length(6, "Le code OTP doit contenir 6 chiffres")
  .regex(/^\d{6}$/, "Le code OTP doit être composé uniquement de chiffres");

export const tokenSchema = z.string().min(1, "Token requis");

// ============================================================
// AUTH SCHEMAS (reste identique)
// ============================================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'ancien",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  language: z.enum(["fr", "en"]).optional(),
  timezone: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const sendOTPSchema = z.object({
  email: emailSchema,
  purpose: z.enum(["LOGIN", "VERIFICATION"]).optional().default("LOGIN"),
});

export const verifyOTPSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: tokenSchema,
});

// ============================================================
// HELPER : VALIDATE WITH ZOD
// ============================================================

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  });

  return { success: false, errors };
}

// ============================================================
// HELPER : EXTRACT & VALIDATE REQUEST BODY
// ============================================================

export async function extractAndValidate<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: Record<string, string> }> {
  try {
    const body = await request.json();
    return validateSchema(schema, body);
  } catch (error) {
    return {
      success: false,
      errors: { body: "Corps de la requête invalide (JSON attendu)" },
    };
  }
}