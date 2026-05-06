// src/hooks/useAuth.ts
"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useRouter }    from "next/navigation";
import { useCallback }  from "react";
import { toast }        from "sonner";
import type { UserRole } from "@/generated/prisma/client";

export function useAuth() {
  const { user, isAuthenticated, isLoading, clearAuth, setUser, setLoading } =
    useAuthStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      clearAuth();
      router.push("/");
      router.refresh();
      toast.success("Déconnexion réussie");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  }, [clearAuth, router, setLoading]);

  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      const { ROLE_PERMISSIONS } = require("@/types");
      const perms: string[] = ROLE_PERMISSIONS[user.role] ?? [];
      return perms.includes(permission);
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    isCustomer:   user?.role === "CUSTOMER",
    isShopAdmin:  user?.role === "SHOP_ADMIN",
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isAdmin:      user?.role === "SHOP_ADMIN" || user?.role === "SUPER_ADMIN",
    hasRole,
    hasPermission,
    logout,
    setUser,
  };
}