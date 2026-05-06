// src/lib/auth/tokens.ts
import { randomBytes, randomInt } from "crypto";
import { prisma }                 from "@/lib/prisma";

const OTP_EXPIRES_MINUTES       = 15;
const RESET_TOKEN_EXPIRES_HOURS = 2;

// ============================================================
// OTP 6 CHIFFRES — Vérification email
// ============================================================

export function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

export async function createEmailVerificationOTP(params: {
  userId:     string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  // Invalider les anciens tokens non utilisés
  await prisma.emailVerificationToken.updateMany({
    where: { userId: params.userId, usedAt: null },
    data:  { usedAt: new Date() },
  });

  const code      = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: {
      userId:    params.userId,
      token:     code,
      expiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  return code;
}

export async function verifyEmailOTP(params: {
  userId: string;
  code:   string;
}): Promise<{ valid: boolean; message: string }> {
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: params.userId,
      token:  params.code,
      usedAt: null,
    },
  });

  if (!record) {
    return { valid: false, message: "Code invalide" };
  }

  if (record.expiresAt < new Date()) {
    return { valid: false, message: "Code expiré. Demandez un nouveau code." };
  }

  // Marquer comme utilisé + vérifier email
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data:  { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: params.userId },
      data:  { emailVerified: true, emailVerifiedAt: new Date() },
    }),
  ]);

  return { valid: true, message: "Email vérifié avec succès" };
}

// ============================================================
// TOKEN RESET PASSWORD — lien URL
// ============================================================

export function generateResetToken(): string {
  return randomBytes(32).toString("hex"); // 64 chars hex
}

export async function createPasswordResetToken(params: {
  userId:     string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  // Invalider les anciens tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: params.userId, usedAt: null },
    data:  { usedAt: new Date() },
  });

  const token     = generateResetToken();
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000
  );

  await prisma.passwordResetToken.create({
    data: {
      userId:    params.userId,
      token,
      expiresAt,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  return token;
}

export async function verifyPasswordResetToken(token: string): Promise<{
  valid:   boolean;
  userId?: string;
  message: string;
}> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt) {
    return { valid: false, message: "Lien invalide ou déjà utilisé" };
  }

  if (record.expiresAt < new Date()) {
    return { valid: false, message: "Lien expiré. Faites une nouvelle demande." };
  }

  return { valid: true, userId: record.userId, message: "Token valide" };
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data:  { usedAt: new Date() },
  });
}