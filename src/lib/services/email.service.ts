import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  /**
   * Envoie un email de vérification
   */
  static async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Supprimer anciens tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Créer nouveau token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24h

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "Vérifiez votre email - Marketplace CG 🇨🇬",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Bienvenue sur Marketplace CG !</h2>
          <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Vérifier mon email
          </a>
          <p style="color: #666; font-size: 14px;">
            Ce lien expire dans 24 heures.<br>
            Si vous n'avez pas créé de compte, ignorez cet email.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Marketplace CG - Made in Congo-Brazzaville 🇨🇬
          </p>
        </div>
      `,
    });
  }

  /**
   * Envoie un OTP par email
   */
  static async sendOTPEmail(email: string, code: string, name?: string): Promise<void> {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: `Code OTP - Marketplace CG`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Votre code de vérification</h2>
          <p>Bonjour ${name || ""},</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; font-size: 48px; margin: 0; letter-spacing: 10px;">${code}</h1>
          </div>
          <p style="color: #666;">
            Ce code expire dans <strong>10 minutes</strong>.<br>
            Ne partagez jamais ce code avec personne.
          </p>
        </div>
      `,
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  static async sendPasswordResetEmail(userId: string, email: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1h

    await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "Réinitialisation de mot de passe - Marketplace CG",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #666; font-size: 14px;">
            Ce lien expire dans 1 heure.<br>
            Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
        </div>
      `,
    });
  }

  /**
   * Vérifie un token de vérification d'email
   */
  static async verifyEmailToken(token: string): Promise<string | null> {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true, usedAt: true },
    });

    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
      return null;
    }

    await prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return verificationToken.userId;
  }

  /**
   * Vérifie un token de reset password
   */
  static async verifyPasswordResetToken(token: string): Promise<string | null> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true, usedAt: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken.userId;
  }

  /**
   * Marque un token de reset comme utilisé
   */
  static async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }
}