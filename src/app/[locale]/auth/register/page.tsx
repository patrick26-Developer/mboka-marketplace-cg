// src/app/[locale]/auth/register/page.tsx
"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  MarketplaceButtonPrimary,
  MarketplaceButtonOutline,
  MarketplaceButtonLink,
} from "@/components/ui/marketplace-button";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

// Règles de validation mot de passe
const passwordRules = {
  minLength: { test: (p: string) => p.length >= 8, label: "8 caractères minimum" },
  uppercase: { test: (p: string) => /[A-Z]/.test(p), label: "Une majuscule" },
  lowercase: { test: (p: string) => /[a-z]/.test(p), label: "Une minuscule" },
  number: { test: (p: string) => /[0-9]/.test(p), label: "Un chiffre" },
  special: { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Un caractère spécial" },
};

export default function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { locale: currentLocale } = useLocale();
  const { register, isRegistering } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFrench = currentLocale === "fr";

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = isFrench
        ? "Le nom est requis (min. 2 caractères)"
        : "Name is required (min. 2 characters)";
    }

    if (!form.email.trim()) {
      newErrors.email = isFrench ? "L'email est requis" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = isFrench ? "Format d'email invalide" : "Invalid email format";
    }

    const passwordValid = Object.values(passwordRules).every((rule) =>
      rule.test(form.password)
    );
    if (!passwordValid) {
      newErrors.password = isFrench
        ? "Le mot de passe ne respecte pas les critères"
        : "Password does not meet requirements";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = isFrench
        ? "Les mots de passe ne correspondent pas"
        : "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    register({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
    });
  };

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `/${locale}`,
      });
    } catch {
      // Géré par la redirection
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Retour */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFrench ? "Retour à l'accueil" : "Back to home"}
        </Link>

        {/* Carte */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="bg-card border border-border rounded-2xl shadow-xl p-8"
        >
          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Marketplace <span className="text-[#e94560]">CG</span> 🇨🇬
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isFrench ? "Créez votre compte" : "Create your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                {isFrench ? "Nom complet" : "Full name"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={isFrench ? "Votre nom" : "Your name"}
                  autoComplete="name"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${
                    errors.name ? "border-red-500" : "border-border"
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                {isFrench ? "Email" : "Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="exemple@email.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${
                    errors.email ? "border-red-500" : "border-border"
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Téléphone (optionnel) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                {isFrench ? "Téléphone (optionnel)" : "Phone (optional)"}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+242 06 123 45 67"
                  autoComplete="tel"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                {isFrench ? "Mot de passe" : "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${
                    errors.password ? "border-red-500" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Indicateurs de force */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(passwordRules).map(([key, rule]) => {
                    const passed = rule.test(form.password);
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
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirmation */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                {isFrench ? "Confirmer le mot de passe" : "Confirm password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${
                    errors.confirmPassword ? "border-red-500" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <MarketplaceButtonPrimary
              type="submit"
              isLoading={isRegistering}
              showIcon={false}
            >
              {isFrench ? "Créer mon compte" : "Create account"}
            </MarketplaceButtonPrimary>
          </form>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {isFrench ? "ou" : "or"}
              </span>
            </div>
          </div>

          {/* Google */}
          <MarketplaceButtonOutline onClick={handleGoogleLogin}>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isFrench ? "Continuer avec Google" : "Continue with Google"}
          </MarketplaceButtonOutline>

          {/* Lien connexion */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isFrench ? "Déjà un compte ?" : "Already have an account?"}{" "}
            <MarketplaceButtonLink href={`/${locale}/auth/login`}>
              {isFrench ? "Se connecter" : "Sign in"}
            </MarketplaceButtonLink>
          </p>
        </motion.div>
      </div>
    </div>
  );
}