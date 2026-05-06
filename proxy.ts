// src/proxy.ts — Next.js 16
import { NextResponse }      from "next/server";
import type { NextRequest }  from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/session";

// ============================================================
// ROUTES PROTÉGÉES
// ============================================================

const ADMIN_ROUTES      = ["/admin"];
const SHOP_ADMIN_ROUTES = ["/shop"];
const AUTH_ROUTES       = ["/account", "/orders", "/profile", "/wishlist"];

// Routes publiques — le proxy laisse passer sans vérification
const PUBLIC_PREFIXES = [
  "/api/v1/auth",
  "/api/v1/upload",
  "/_next",
  "/favicon",
  "/public",
];

// ============================================================
// PROXY FUNCTION
// ============================================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Laisser passer les routes publiques
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // 2. Vérifier si la route nécessite auth
  const needsAuth =
    ADMIN_ROUTES.some((r) => pathname.startsWith(r))      ||
    SHOP_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (!needsAuth) return NextResponse.next();

  // 3. Lire le token
  const token = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Vérifier le JWT (léger — pas de DB dans le proxy !)
  try {
    const payload = await verifyAccessToken(token);
    const role    = payload.role;

    // 5. Vérifications par rôle
    if (
      ADMIN_ROUTES.some((r) => pathname.startsWith(r)) &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    if (
      SHOP_ADMIN_ROUTES.some((r) => pathname.startsWith(r)) &&
      role !== "SHOP_ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/403", request.url));
    }

    // 6. Injecter les infos dans les headers pour les Route Handlers
    const response = NextResponse.next();
    response.headers.set("x-user-id",    payload.sub);
    response.headers.set("x-user-role",  payload.role);
    response.headers.set("x-session-id", payload.sessionId);
    return response;

  } catch {
    // Token expiré ou invalide
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_ACCESS_TOKEN);
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/shop/:path*",
    "/account/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};