// src/components/shared/LocaleSwitcher.tsx
"use client";

import { useLocale } from "@/hooks/useLocale";
import { motion } from "framer-motion";

export function LocaleSwitcher() {
  const { locale, locales, changeLocale } = useLocale();

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
      {locales.map((loc) => {
        const isActive = locale === loc;
        return (
          <button
            key={loc}
            onClick={() => changeLocale(loc)}
            className={`
              relative px-3 py-1.5 text-xs font-medium rounded-md uppercase
              transition-colors duration-200
              ${isActive 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="locale-indicator"
                className="absolute inset-0 bg-muted rounded-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{loc}</span>
          </button>
        );
      })}
    </div>
  );
}