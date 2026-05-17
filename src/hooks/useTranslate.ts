// src/hooks/useTranslate.ts
"use client";

import { useLocale } from "./useLocale";
import messagesEn from "@/i18n/messages/en.json";
import messagesFr from "@/i18n/messages/fr.json";

type Messages = typeof messagesFr;

// ✅ Type récursif pour naviguer dans l'objet JSON de manière type-safe
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

export type MessageKey = NestedKeyOf<Messages>;

const messages: Record<"fr" | "en", Messages> = {
  fr: messagesFr,
  en: messagesEn,
};

// Type pour la valeur de retour (string | object)
type MessageValue = string | Record<string, unknown>;

export function useTranslate() {
  const { locale } = useLocale();

  const t = (key: MessageKey): string => {
    const keys = key.split(".");
    let value: MessageValue = messages[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k as keyof typeof value] as MessageValue;
      } else {
        console.warn(`[i18n] Missing translation for key: ${key} (locale: ${locale})`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  return { t, locale };
}