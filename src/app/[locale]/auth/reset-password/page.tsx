// src/app/[locale]/auth/reset-password/page.tsx
"use client";

import { useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  MarketplaceButtonPrimary,
  MarketplaceButtonLink,
} from "@/components/ui/marketplace-button";
import {
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// Règles de validation
const passwordRules = {
  minLength: { test: (p: string) => p.length >= 8, label: "8 caractères minimum" },
  uppercase: { test: (p: string) => /[A-Z]/.test(p), label: "Une majuscule" },
  lowercase: { test: (p: string) => /[a-z]/.test(p), label: "Une minuscule" },
  number: { test: (p: string) => /[0-9]/.test(p), label: "Un chiffre" },
  special: { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Un caractère spécial" },
};

function ResetPasswordForm({ locale }: { locale: string }) {
  const { locale: currentLocale } = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword, isResettingPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isFrench = currentLocale === "fr";

  // Pas de token
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isFrench ? "Lien invalide" : "Invalid link"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {isFrench
            ? "Ce lien de réinitialisation est invalide ou a expiré."
            : "This reset link is invalid or has expired."}
        </p>
        <MarketplaceButtonLink href={`/${locale}/auth/forgot-password`}>
          {isFrench ? "Demander un nouveau lien" : "Request a new link"}
        </MarketplaceButtonLink>
      </motion.div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passwordValid = Object.values(passwordRules).every((rule) =>
      rule.test(password)
    );
    if (!passwordValid) {
      setError(
        isFrench
          ? "Le mot de passe ne respecte pas les critères"
          : "Password does not meet requirements"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isFrench
          ? "Les mots de passe ne correspondent pas"
          : "Passwords do not match"
      );
      return;
    }

    resetPassword({ token, newPassword: password, confirmPassword });
    setSuccess(true);
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isFrench ? "Mot de passe modifié !" : "Password changed!"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {isFrench
            ? "Votre mot de passe a été réinitialisé avec succès."
            : "Your password has been successfully reset."}
        </p>
        <MarketplaceButtonLink href={`/${locale}/auth/login`}>
          {isFrench ? "Se connecter" : "Sign in"}
        </MarketplaceButtonLink>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl shadow-xl p-8"
    >
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-[#0072BC]/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="h-8 w-8 text-[#0072BC]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isFrench ? "Nouveau mot de passe" : "New password"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isFrench
            ? "Choisissez un nouveau mot de passe sécurisé."
            : "Choose a new secure password."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nouveau mot de passe */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {isFrench ? "Nouveau mot de passe" : "New password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(passwordRules).map(([key, rule]) => {
                const passed = rule.test(password);
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    {passed ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmation */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {isFrench ? "Confirmer le mot de passe" : "Confirm password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {isFrench ? "Les mots de passe ne correspondent pas" : "Passwords do not match"}
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <MarketplaceButtonPrimary
          type="submit"
          isLoading={isResettingPassword}
          showIcon={false}
        >
          {isFrench ? "Réinitialiser le mot de passe" : "Reset password"}
        </MarketplaceButtonPrimary>
      </form>
    </motion.div>
  );
}

// Page wrapper avec Suspense pour useSearchParams
export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "fr" ? "Retour à la connexion" : "Back to login"}
        </Link>

        <Suspense
          fallback={
            <div className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          }
        >
          <ResetPasswordForm locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}