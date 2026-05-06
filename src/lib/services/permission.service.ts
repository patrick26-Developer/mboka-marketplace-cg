import { UserRole } from "@/generated/prisma/client";
import { Permission, ROLE_PERMISSIONS, ROLE_REDIRECTS } from "@/types";

export class PermissionService {
  /**
   * Vérifie si un rôle a une permission donnée
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  }

  /**
   * Vérifie si un rôle a AU MOINS UNE des permissions
   */
  static hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(role, permission));
  }

  /**
   * Vérifie si un rôle a TOUTES les permissions
   */
  static hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(role, permission));
  }

  /**
   * Détermine si un rôle peut accéder à une route
   */
  static canAccessRoute(role: UserRole, route: string): boolean {
    // Routes publiques
    const publicRoutes = [
      "/api/v1/auth/login",
      "/api/v1/auth/register",
      "/api/v1/auth/google",
      "/api/v1/products",
    ];
    if (publicRoutes.some((r) => route.startsWith(r))) {
      return true;
    }

    // Routes SUPER_ADMIN uniquement
    const superAdminRoutes = ["/api/v1/admin", "/api/v1/users"];
    if (superAdminRoutes.some((r) => route.startsWith(r))) {
      return role === UserRole.SUPER_ADMIN;
    }

    // Routes SHOP_ADMIN + SUPER_ADMIN
    const shopAdminRoutes = ["/api/v1/shops", "/api/v1/products/manage"];
    if (shopAdminRoutes.some((r) => route.startsWith(r))) {
      return role === UserRole.SUPER_ADMIN || role === UserRole.SHOP_ADMIN;
    }

    return true;
  }

  /**
   * Retourne la route de redirection par défaut pour un rôle
   */
  static getRedirectPath(role: UserRole): string {
    return ROLE_REDIRECTS[role];
  }

  /**
   * Liste toutes les permissions d'un rôle
   */
  static getPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role];
  }
}