// src/components/shared/LocaleSwitcher.tsx
"use client";

import { useLocale } from "@/hooks/useLocale";
import { localeNames } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";
import { motion } from "framer-motion";

export function LocaleSwitcher() {
  const { locale, locales, changeLocale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-accent/50 transition-colors duration-200"
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((loc, index) => (
          <motion.div
            key={loc}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DropdownMenuItem
              onClick={() => changeLocale(loc)}
              className={`cursor-pointer transition-colors duration-150 ${
                locale === loc 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-accent/50"
              }`}
            >
              <span className="flex items-center justify-between w-full">
                <span className="font-medium">{localeNames[loc]}</span>
                {locale === loc && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </span>
            </DropdownMenuItem>
          </motion.div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}