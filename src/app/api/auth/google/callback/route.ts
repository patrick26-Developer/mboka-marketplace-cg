// src/app/api/v1/auth/google/callback/route.ts
import { auth } from "@/lib/auth/better-auth";
import { prisma } from "@/lib/prisma";
import { generateTokenPair, ACCESS_TOKEN_EXPIRES_IN_MS } from "@/lib/auth/jwt";
import { createSession, createRefreshTokenRecord, setAuthCookies } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/client";
import { cookies } from "next/headers";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const betterAuthSession = await auth.api.getSession({
      headers: new Headers(request.headers),
    });

    if (!betterAuthSession?.user?.email) {
      return NextResponse.redirect(
        new URL("/fr/auth/login?error=google_failed", request.url)
      );
    }

    const email: string = betterAuthSession.user.email;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isLocked: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/fr/auth/login?error=user_not_found", request.url)
      );
    }

    if (user.role !== UserRole.CUSTOMER) {
      return NextResponse.redirect(
        new URL("/fr/auth/login?error=admin_google_forbidden", request.url)
      );
    }

    if (!user.isActive || user.isLocked) {
      return NextResponse.redirect(
        new URL("/fr/auth/login?error=account_locked", request.url)
      );
    }

    const cookieStore = await cookies();
    const locale = cookieStore.get("mcg-locale")?.value === "en" ? "en" : "fr";

    const now = Date.now();
    const tokenId = crypto.randomUUID();
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const sessionId = await createSession({
      userId: user.id,
      token: "",
      expiresAt: new Date(now + ACCESS_TOKEN_EXPIRES_IN_MS),
      ipAddress,
      userAgent,
    });

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      tokenId,
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: { token: tokens.accessToken },
    });

    await createRefreshTokenRecord({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    await setAuthCookies({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    });

    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur callback Google";
    console.error("[Google Callback]", message);
    return NextResponse.redirect(
      new URL("/fr/auth/login?error=callback_failed", request.url)
    );
  }
}