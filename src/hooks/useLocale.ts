// src/hooks/useLocale.ts
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mcg-locale";
const DEFAULT_LOCALE = "fr";
const AVAILABLE_LOCALES = ["fr", "en"] as const;

export type Locale = (typeof AVAILABLE_LOCALES)[number];

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en") return stored;
  } catch {}
  return DEFAULT_LOCALE;
}

function setCookieLocale(locale: Locale) {
  document.cookie = `${STORAGE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function useLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const changeLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
        setCookieLocale(newLocale);
      } catch {}

      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 0 && AVAILABLE_LOCALES.includes(segments[0] as Locale)) {
        segments[0] = newLocale;
      } else {
        segments.unshift(newLocale);
      }

      const newPath = "/" + segments.join("/");
      router.push(newPath);
    },
    [router, pathname]
  );

  return { locale, locales: AVAILABLE_LOCALES as unknown as Locale[], changeLocale };
}