// src/app/[locale]/auth/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  MarketplaceButtonPrimary,
  MarketplaceButtonOutline,
  MarketplaceButtonLink,
} from "@/components/ui/marketplace-button";
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

function LoginForm() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}`;
  const errorParam = searchParams.get("error");
  const { login, isLoggingIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const isFrench = locale === "fr";

  const oauthErrors: Record<string, string> = {
    google_failed: isFrench ? "La connexion Google a échoué." : "Google login failed.",
    user_not_found: isFrench ? "Aucun compte trouvé." : "No account found.",
    admin_google_forbidden: isFrench ? "Les admins doivent utiliser email/mot de passe." : "Admins must use email/password.",
    account_locked: isFrench ? "Compte verrouillé." : "Account locked.",
    callback_failed: isFrench ? "Erreur de connexion." : "Login error.",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = isFrench ? "L'email est requis" : "Email is required";
    if (!password) newErrors.password = isFrench ? "Le mot de passe est requis" : "Password is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    login({ email: email.trim().toLowerCase(), password });
  };

  const handleGoogleLogin = () => {
    authClient.signIn.social({ provider: "google", callbackURL: callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          {isFrench ? "Retour à l'accueil" : "Back to home"}
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Marketplace <span className="text-[#e94560]">CG</span> 🇨🇬</h1>
            <p className="text-muted-foreground text-sm mt-2">{isFrench ? "Connectez-vous" : "Sign in"}</p>
          </div>

          <AnimatePresence>
            {errorParam && oauthErrors[errorParam] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{oauthErrors[errorParam]}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">{isFrench ? "Email" : "Email"}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" autoComplete="email" className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${errors.email ? "border-red-500" : "border-border"}`} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">{isFrench ? "Mot de passe" : "Password"}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={`w-full pl-10 pr-12 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${errors.password ? "border-red-500" : "border-border"}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="text-right">
              <MarketplaceButtonLink href={`/${locale}/auth/forgot-password`}>{isFrench ? "Mot de passe oublié ?" : "Forgot password?"}</MarketplaceButtonLink>
            </div>

            <MarketplaceButtonPrimary type="submit" isLoading={isLoggingIn} showIcon={false}>{isFrench ? "Se connecter" : "Sign in"}</MarketplaceButtonPrimary>
          </form>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{isFrench ? "ou" : "or"}</span></div></div>

          <MarketplaceButtonOutline onClick={handleGoogleLogin}>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {isFrench ? "Continuer avec Google" : "Continue with Google"}
          </MarketplaceButtonOutline>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isFrench ? "Pas encore de compte ?" : "Don't have an account?"}{" "}
            <MarketplaceButtonLink href={`/${locale}/auth/register`}>{isFrench ? "S'inscrire" : "Sign up"}</MarketplaceButtonLink>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}