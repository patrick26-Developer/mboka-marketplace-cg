// src/app/[locale]/403/page.tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/hooks/useLocale";
import { MarketplaceButtonPrimary } from "@/components/ui/marketplace-button";
import { ShieldX, Home } from "lucide-react";

export default function ForbiddenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { locale: currentLocale } = useLocale();
  const isFrench = currentLocale === "fr";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">403</h1>
        <p className="text-xl font-semibold text-foreground mb-2">
          {isFrench ? "Accès refusé" : "Access Denied"}
        </p>
        <p className="text-muted-foreground mb-8">
          {isFrench
            ? "Vous n'avez pas les permissions nécessaires pour accéder à cette page."
            : "You do not have the necessary permissions to access this page."}
        </p>

        <Link href={`/${locale}`}>
          <MarketplaceButtonPrimary showIcon={false}>
            <Home className="h-4 w-4" />
            {isFrench ? "Retour à l'accueil" : "Back to home"}
          </MarketplaceButtonPrimary>
        </Link>
      </motion.div>
    </div>
  );
}