import prisma from "@/lib/prisma";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export class OTPService {
  /**
   * Génère un code OTP à 6 chiffres
   */
  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Envoie un OTP par email
   */
  static async sendOTP(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    // Supprimer les anciens OTP non utilisés
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    const code = this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: code,
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Vérifie un code OTP
   */
  static async verifyOTP(email: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return false;
    }

    const otpRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return false;
    }

    if (otpRecord.expiresAt < new Date()) {
      return false;
    }

    // Marquer comme utilisé
    await prisma.emailVerificationToken.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Marquer l'email comme vérifié
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Vérifie si un nouvel OTP peut être envoyé (rate limiting)
   */
  static async canResendOTP(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return false;
    }

    const recentOTP = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 60000), // 1 minute
        },
      },
    });

    return !recentOTP;
  }
}