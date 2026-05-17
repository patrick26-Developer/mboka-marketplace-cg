// src/app/[locale]/auth/verify-email/page.tsx
"use client";

import { useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import {
  MarketplaceButtonPrimary,
  MarketplaceButtonLink,
} from "@/components/ui/marketplace-button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { locale: currentLocale } = useLocale();
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    verifyEmail,
    isVerifyingEmail,
    resendVerification,
    isResendingVerification,
  } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const isFrench = currentLocale === "fr";

  // Rediriger si non connecté
  if (!isAuthenticated || !user) {
    router.push(`/${locale}/auth/login`);
    return null;
  }

  // Rediriger si déjà vérifié
  if (user.emailVerified) {
    router.push(`/${locale}`);
    return null;
  }

  const handleComplete = useCallback(
    (value: string) => {
      if (value.length === 6) {
        setError("");
        verifyEmail(value);
      }
    },
    [verifyEmail]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError(
        isFrench
          ? "Veuillez entrer le code complet à 6 chiffres"
          : "Please enter the complete 6-digit code"
      );
      return;
    }
    verifyEmail(code);
  };

  const handleResend = () => {
    resendVerification(user.email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Retour */}
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
          className="bg-card border border-border rounded-2xl shadow-xl p-8 text-center"
        >
          {/* Icône */}
          <div className="mx-auto w-16 h-16 bg-[#0072BC]/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-[#0072BC]" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isFrench ? "Vérifiez votre email" : "Verify your email"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {isFrench
              ? `Nous avons envoyé un code à 6 chiffres à ${user.email}`
              : `We sent a 6-digit code to ${user.email}`}
          </p>

          {/* Input OTP */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => {
                  setCode(value);
                  setError("");
                }}
                onComplete={handleComplete}
                disabled={isVerifyingEmail}
                aria-label={
                  isFrench
                    ? "Code de vérification à 6 chiffres"
                    : "6-digit verification code"
                }
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4" role="alert">
                {error}
              </p>
            )}

            <MarketplaceButtonPrimary
              type="submit"
              isLoading={isVerifyingEmail}
              disabled={code.length !== 6}
              showIcon={false}
            >
              {isFrench ? "Vérifier mon email" : "Verify my email"}
            </MarketplaceButtonPrimary>
          </form>

          {/* Renvoyer */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendingVerification}
              className="inline-flex items-center gap-2 text-sm text-[#0072BC] hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isResendingVerification ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isFrench ? "Renvoyer le code" : "Resend code"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {isFrench
              ? "Le code expire dans 15 minutes"
              : "Code expires in 15 minutes"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}