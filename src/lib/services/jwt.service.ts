import { SignJWT, jwtVerify } from "jose";
import { JWTPayload } from "@/types";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

export class JWTService {
  // ============================================================
  // CREATE ACCESS TOKEN
  // ============================================================
  static async createAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
    return new SignJWT(payload as any)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(JWT_SECRET);
  }

  // ============================================================
  // CREATE REFRESH TOKEN
  // ============================================================
  static async createRefreshToken(
    userId: string,
    deviceInfo?: Record<string, any>
  ): Promise<string> {
    const token = crypto.randomBytes(64).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        deviceInfo: deviceInfo || {},
      },
    });

    return token;
  }

  // ============================================================
  // VERIFY ACCESS TOKEN
  // ============================================================
  static async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as JWTPayload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  }

  // ============================================================
  // VERIFY REFRESH TOKEN
  // ============================================================
  static async verifyRefreshToken(token: string): Promise<string | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true, isRevoked: true },
    });

    if (!refreshToken || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
      return null;
    }

    return refreshToken.userId;
  }

  // ============================================================
  // REVOKE REFRESH TOKEN
  // ============================================================
  static async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  // ============================================================
  // REVOKE ALL USER TOKENS
  // ============================================================
  static async revokeAllUserTokens(userId: string): Promise<void> {
    // ✅ RefreshToken garde isRevoked
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    // ✅ Session n'a plus isRevoked — on supprime directement
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  // ============================================================
  // CREATE SESSION
  // ============================================================
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token: sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return session.id;
  }

  // ============================================================
  // VERIFY SESSION
  // ============================================================
  static async verifySession(sessionId: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { expiresAt: true }, // ✅ isRevoked supprimé du modèle Session
    });

    if (!session || session.expiresAt < new Date()) {
      return false;
    }

    return true;
  }
}