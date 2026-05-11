// src/i18n/config.ts
export const locales = ["en", "fr"] as const;
export const defaultLocale = "fr" as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};