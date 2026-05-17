// src/hooks/useAuth.ts
"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ROLE_REDIRECTS } from "@/types";
import type { UserRole } from "@/generated/prisma/client";
import type {
  LoginInput,
  RegisterInput,
  UserPublic,
  ChangePasswordInput,
  ResetPasswordInput,
} from "@/types";

export function useAuth() {
  const { user, isAuthenticated, isLoading, clearAuth, setUser, setLoading } =
    useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Extraire la locale du pathname
  const getLocale = useCallback(() => {
    const segments = pathname.split("/");
    return segments[1] === "fr" || segments[1] === "en" ? segments[1] : "fr";
  }, [pathname]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearAuth();
      const locale = getLocale();
      router.push(`/${locale}`);
      router.refresh();
      toast.success("Déconnexion réussie");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  }, [clearAuth, router, setLoading, getLocale]);

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

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      console.log("========================================");
      console.log("[AUTH/LOGIN] Tentative de connexion");
      console.log("Email:", data.email);
      console.log("Timestamp:", new Date().toISOString());

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/LOGIN] Echec:", json.message);
        throw new Error(json.message || "Connexion échouée");
      }

      console.log("[AUTH/LOGIN] Connexion réussie");
      console.log("UserID:", json.data.user.id);
      console.log("Role:", json.data.user.role);
      console.log("========================================");

      return json.data.user as UserPublic;
    },
    onSuccess: (userData) => {
      setUser(userData);
      toast.success("Connexion réussie");

      const locale = getLocale();
      const basePath = ROLE_REDIRECTS[userData.role];
      const redirectPath = `/${locale}${basePath}`;

      console.log("[AUTH/LOGIN] Redirection vers:", redirectPath);

      router.push(redirectPath);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      console.log("========================================");
      console.log("[AUTH/REGISTER] Tentative d'inscription");
      console.log("Email:", data.email);
      console.log("Nom:", data.name);
      console.log("Timestamp:", new Date().toISOString());

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/REGISTER] Echec:", json.message);
        console.error("Erreurs:", json.errors);
        throw new Error(json.message || "Inscription échouée");
      }

      console.log("[AUTH/REGISTER] Inscription réussie");
      console.log("UserID:", json.data.user.id);
      console.log("Email vérifié:", json.data.user.emailVerified);
      console.log("========================================");

      return json.data.user as UserPublic;
    },
    onSuccess: (userData) => {
      setUser(userData);
      toast.success("Compte créé. Vérifiez votre email.");

      const locale = getLocale();
      console.log("[AUTH/REGISTER] Redirection vers:", `/${locale}/auth/verify-email`);
      router.push(`/${locale}/auth/verify-email`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (code: string) => {
      console.log("========================================");
      console.log("[AUTH/VERIFY] Vérification OTP");
      console.log("Code:", code);

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/VERIFY] Echec:", json.message);
        throw new Error(json.message || "Code invalide");
      }

      console.log("[AUTH/VERIFY] Email vérifié");
      console.log("========================================");

      return json;
    },
    onSuccess: () => {
      toast.success("Email vérifié avec succès");
      const locale = getLocale();
      router.push(`/${locale}/auth/login`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log("========================================");
      console.log("[AUTH/RESEND] Renvoi code vérification");
      console.log("Email:", email);

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/RESEND] Echec:", json.message);
        throw new Error(json.message || "Erreur");
      }

      console.log("[AUTH/RESEND] Code renvoyé");
      console.log("========================================");

      return json;
    },
    onSuccess: () => {
      toast.success("Code de vérification renvoyé");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log("========================================");
      console.log("[AUTH/FORGOT] Demande reset mot de passe");
      console.log("Email:", email);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/FORGOT] Echec:", json.message);
        throw new Error(json.message || "Erreur");
      }

      console.log("[AUTH/FORGOT] Email envoyé");
      console.log("========================================");

      return json;
    },
    onSuccess: () => {
      toast.success("Email de réinitialisation envoyé");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      console.log("========================================");
      console.log("[AUTH/RESET] Reset mot de passe");
      console.log("Token:", data.token.substring(0, 10) + "...");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/RESET] Echec:", json.message);
        throw new Error(json.message || "Erreur");
      }

      console.log("[AUTH/RESET] Mot de passe réinitialisé");
      console.log("========================================");

      return json;
    },
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès");
      const locale = getLocale();
      router.push(`/${locale}/auth/login`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      console.log("========================================");
      console.log("[AUTH/CHANGE] Changement mot de passe");

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("[AUTH/CHANGE] Echec:", json.message);
        throw new Error(json.message || "Erreur");
      }

      console.log("[AUTH/CHANGE] Mot de passe modifié");
      console.log("========================================");

      return json;
    },
    onSuccess: () => {
      toast.success("Mot de passe modifié avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    isCustomer: user?.role === "CUSTOMER",
    isShopAdmin: user?.role === "SHOP_ADMIN",
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isAdmin: user?.role === "SHOP_ADMIN" || user?.role === "SUPER_ADMIN",

    hasRole,
    hasPermission,

    logout,
    setUser,

    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,

    verifyEmail: verifyEmailMutation.mutate,
    verifyEmailAsync: verifyEmailMutation.mutateAsync,
    isVerifyingEmail: verifyEmailMutation.isPending,

    resendVerification: resendVerificationMutation.mutate,
    resendVerificationAsync: resendVerificationMutation.mutateAsync,
    isResendingVerification: resendVerificationMutation.isPending,

    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    isForgettingPassword: forgotPasswordMutation.isPending,

    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,

    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}