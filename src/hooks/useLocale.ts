// src/hooks/useLocale.ts
"use client";

import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { type Locale, locales } from "@/i18n/config";

export function useLocale() {
  const currentLocale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (newLocale: Locale) => {
    // Remplacer la locale dans l'URL
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPath = segments.join("/");
    
    router.push(newPath);
    router.refresh();
  };

  return {
    locale: currentLocale,
    locales,
    changeLocale,
  };
}