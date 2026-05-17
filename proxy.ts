// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { COOKIE_ACCESS_TOKEN } from "@/lib/auth/session";

const DEFAULT_LOCALE = "fr";
const LOCALES = ["fr", "en"];

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/upload",
  "/api/auth",
  "/auth",
  "/_next",
  "/favicon",
  "/public",
  "/api/products",
  "/api/categories",
  "/403",
];

const ADMIN_ROUTES = ["/admin"];
const SHOP_ADMIN_ROUTES = ["/shop"];
const AUTH_ROUTES = ["/account", "/orders", "/profile", "/wishlist", "/checkout", "/cart"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================
  // ÉTAPE 0 : Laisser passer les requêtes API et assets SANS toucher
  // ============================================================
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ============================================================
  // ÉTAPE 1 : Redirection de locale
  // ============================================================
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] || "";

  // Si pas de locale → rediriger vers la locale par défaut
  if (!firstSegment || !LOCALES.includes(firstSegment)) {
    const newPathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(new URL(newPathname, request.url));
  }

  const locale = firstSegment;
  const pathWithoutLocale = "/" + segments.slice(1).join("/");

  // ============================================================
  // ÉTAPE 2 : Routes publiques
  // ============================================================
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname.startsWith(p) || pathWithoutLocale.startsWith(p)
  );
  if (isPublic) return NextResponse.next();

  // ============================================================
  // ÉTAPE 3 : Routes protégées
  // ============================================================
  const needsAuth =
    ADMIN_ROUTES.some((r) => pathWithoutLocale.startsWith(r)) ||
    SHOP_ADMIN_ROUTES.some((r) => pathWithoutLocale.startsWith(r)) ||
    AUTH_ROUTES.some((r) => pathWithoutLocale.startsWith(r));

  if (!needsAuth) return NextResponse.next();

  // ============================================================
  // ÉTAPE 4 : Vérification token
  // ============================================================
  const token = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!token) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyAccessToken(token);
    const role = payload.role;

    if (
      ADMIN_ROUTES.some((r) => pathWithoutLocale.startsWith(r)) &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL(`/${locale}/403`, request.url));
    }

    if (
      SHOP_ADMIN_ROUTES.some((r) => pathWithoutLocale.startsWith(r)) &&
      role !== "SHOP_ADMIN" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL(`/${locale}/403`, request.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.sub);
    response.headers.set("x-user-role", payload.role);
    response.headers.set("x-session-id", payload.sessionId);
    return response;
  } catch {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_ACCESS_TOKEN);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};