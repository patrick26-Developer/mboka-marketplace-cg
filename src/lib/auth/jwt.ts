// src/lib/auth/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface AccessTokenPayload extends JWTPayload {
  sub:       string;
  email:     string;
  role:      "SUPER_ADMIN" | "SHOP_ADMIN" | "CUSTOMER";
  sessionId: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub:     string;
  tokenId: string;
}

export interface TokenPair {
  accessToken:           string;
  refreshToken:          string;
  accessTokenExpiresAt:  Date;
  refreshTokenExpiresAt: Date;
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET manquant dans .env");
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET manquant dans .env");
  return new TextEncoder().encode(secret);
}

const ACCESS_TOKEN_TTL  = "15m";
const REFRESH_TOKEN_TTL = "30d";

export const ACCESS_TOKEN_EXPIRES_IN_MS  = 15 * 60 * 1000;
export const REFRESH_TOKEN_EXPIRES_IN_MS = 30 * 24 * 60 * 60 * 1000;

export async function generateAccessToken(params: {
  sub:       string;
  email:     string;
  role:      AccessTokenPayload["role"];
  sessionId: string;
}): Promise<string> {
  return new SignJWT({
    // ✅ Chaque champ est explicitement typé string — plus d'unknown
    email:     params.email,
    role:      params.role,
    sessionId: params.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.sub)           // ✅ string garanti
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer("marketplace-cg")
    .setAudience("marketplace-cg-client")
    .sign(getAccessSecret());
}

export async function generateRefreshToken(params: {
  sub:     string;
  tokenId: string;
}): Promise<string> {
  return new SignJWT({
    // ✅ tokenId est explicitement string
    tokenId: params.tokenId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.sub)           // ✅ string garanti
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .setIssuer("marketplace-cg")
    .setAudience("marketplace-cg-refresh")
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret(), {
    issuer:   "marketplace-cg",
    audience: "marketplace-cg-client",
  });

  if (
    typeof payload.sub       !== "string" ||
    typeof payload.email     !== "string" ||
    typeof payload.role      !== "string" ||
    typeof payload.sessionId !== "string"
  ) {
    throw new Error("Access token payload invalide");
  }

  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret(), {
    issuer:   "marketplace-cg",
    audience: "marketplace-cg-refresh",
  });

  if (
    typeof payload.sub     !== "string" ||
    typeof payload.tokenId !== "string"
  ) {
    throw new Error("Refresh token payload invalide");
  }

  return payload as RefreshTokenPayload;
}

export async function generateTokenPair(params: {
  userId:    string;
  email:     string;
  role:      AccessTokenPayload["role"];
  sessionId: string;
  tokenId:   string;
}): Promise<TokenPair> {
  const now = Date.now();

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken({
      sub:       params.userId,   // ✅ string explicite
      email:     params.email,
      role:      params.role,
      sessionId: params.sessionId,
    }),
    generateRefreshToken({
      sub:     params.userId,     // ✅ string explicite
      tokenId: params.tokenId,
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt:  new Date(now + ACCESS_TOKEN_EXPIRES_IN_MS),
    refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_EXPIRES_IN_MS),
  };
}