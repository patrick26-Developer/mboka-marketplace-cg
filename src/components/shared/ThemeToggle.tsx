"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useThemeContext } from "@/providers/ThemeProvider";

interface ThemeOption {
  value: "light" | "dark" | "system";
  icon: typeof Sun;
  label: string;
}

const themes: ThemeOption[] = [
  { value: "light", icon: Sun, label: "Clair" },
  { value: "dark", icon: Moon, label: "Sombre" },
  { value: "system", icon: Monitor, label: "Auto" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative px-3 py-1.5 text-xs font-medium rounded-md
              transition-colors duration-200
              ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
            aria-label={label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 bg-muted rounded-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}