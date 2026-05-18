import { cookies }             from "next/headers";
import { NextResponse }        from "next/server";
import { verifyAccessToken }   from "@/lib/auth/jwt";
import { prisma }              from "@/lib/prisma";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/session";
import type { AccessTokenPayload } from "@/lib/auth/jwt";

interface GuardResult {
  user:  AccessTokenPayload | null;
  error: NextResponse | null;
}

export async function authenticate(
  request: Request
): Promise<GuardResult> {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

    const authHeader  = request.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken ?? headerToken;

    if (!token) {
      return {
        user:  null,
        error: NextResponse.json(
          {
            success:   false,
            message:   "Non authentifié",
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        ),
      };
    }

    const payload = await verifyAccessToken(token);

    // ✅ OPTIMISÉ : 1 seule requête avec include
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        user: {
          select: {
            isActive: true,
            isLocked: true,
          },
        },
      },
    });

    if (!session) {
      return {
        user:  null,
        error: NextResponse.json(
          {
            success:   false,
            message:   "Session expirée ou révoquée",
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        ),
      };
    }

    if (!session.user.isActive || session.user.isLocked) {
      return {
        user:  null,
        error: NextResponse.json(
          {
            success:   false,
            message:   "Compte désactivé ou verrouillé",
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        ),
      };
    }

    return { user: payload, error: null };
  } catch {
    return {
      user:  null,
      error: NextResponse.json(
        {
          success:   false,
          message:   "Token invalide",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }
}

export async function requireRole(
  request: Request,
  ...roles: Array<"SUPER_ADMIN" | "SHOP_ADMIN" | "CUSTOMER">
): Promise<GuardResult> {
  const result = await authenticate(request);
  if (result.error) return result;

  if (!roles.includes(result.user!.role)) {
    return {
      user:  null,
      error: NextResponse.json(
        {
          success:   false,
          message:   `Accès refusé. Rôle requis : ${roles.join(" ou ")}`,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      ),
    };
  }

  return result;
}