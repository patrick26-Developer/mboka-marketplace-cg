// src/app/[locale]/auth/forgot-password/page.tsx
"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  MarketplaceButtonPrimary,
  MarketplaceButtonLink,
} from "@/components/ui/marketplace-button";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { locale: currentLocale } = useLocale();
  const { forgotPassword, isForgettingPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const isFrench = currentLocale === "fr";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(
        isFrench
          ? "Veuillez entrer un email valide"
          : "Please enter a valid email"
      );
      return;
    }

    forgotPassword(email.trim().toLowerCase());
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFrench ? "Retour à la connexion" : "Back to login"}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="bg-card border border-border rounded-2xl shadow-xl p-8"
        >
          <AnimatePresence mode="wait">
            {sent ? (
              // État : Email envoyé
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {isFrench ? "Email envoyé !" : "Email sent!"}
                </h1>
                <p className="text-muted-foreground text-sm mb-6">
                  {isFrench
                    ? "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes."
                    : "If an account exists with this email, you'll receive a reset link within a few minutes."}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  {isFrench
                    ? "Vérifiez aussi vos spams."
                    : "Also check your spam folder."}
                </p>
                <MarketplaceButtonLink href={`/${locale}/auth/login`}>
                  {isFrench ? "Retour à la connexion" : "Back to login"}
                </MarketplaceButtonLink>
              </motion.div>
            ) : (
              // État : Formulaire
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-[#0072BC]/10 rounded-full flex items-center justify-center mb-6">
                    <Mail className="h-8 w-8 text-[#0072BC]" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {isFrench ? "Mot de passe oublié ?" : "Forgot password?"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {isFrench
                      ? "Entrez votre email pour recevoir un lien de réinitialisation."
                      : "Enter your email to receive a reset link."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      {isFrench ? "Email" : "Email"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="exemple@email.com"
                        autoComplete="email"
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#0072BC]/50 transition-all ${
                          error ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-xs mt-1">{error}</p>
                    )}
                  </div>

                  <MarketplaceButtonPrimary
                    type="submit"
                    isLoading={isForgettingPassword}
                    showIcon={false}
                  >
                    {isFrench ? "Envoyer le lien" : "Send reset link"}
                  </MarketplaceButtonPrimary>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  <MarketplaceButtonLink href={`/${locale}/auth/login`}>
                    {isFrench ? "Retour à la connexion" : "Back to login"}
                  </MarketplaceButtonLink>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}