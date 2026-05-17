// src/components/ui/marketplace-button
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

// ============================================================
// VARIANTS FRAMER MOTION
// ============================================================

const buttonBaseVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  hover: {
    y: -2,
    boxShadow: "0 6px 20px rgba(0,90,156,0.35)",
    transition: {
      duration: 0.18,
      ease: "easeOut" as const,
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
    boxShadow: "none",
    transition: {
      duration: 0.08,
    },
  },
  shimmer: {
    background: [
      "linear-gradient(90deg, #0072BC 0%, #0072BC 100%)",
      "linear-gradient(90deg, #0072BC 0%, #0088e0 40%, #0072BC 80%)",
      "linear-gradient(90deg, #0072BC 0%, #0072BC 100%)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const customEase: [number, number, number, number] = [0.4, 0, 0.2, 1];

// ============================================================
// 1. PRIMARY BUTTON
// ============================================================

interface MarketplaceButtonPrimaryProps {
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  href?: string;
  variant?: "primary" | "shimmer" | "cta-blue";
  size?: "default" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

export function MarketplaceButtonPrimary({
  children,
  className,
  showIcon = true,
  isLoading = false,
  isSuccess = false,
  href,
  variant = "primary",
  size = "default",
  type = "button",
  disabled,
  onClick,
}: MarketplaceButtonPrimaryProps) {
  const isDisabled = disabled || isLoading || isSuccess;

  const content = (
    <motion.button
      variants={buttonBaseVariants}
      initial="initial"
      animate={isLoading ? "shimmer" : "animate"}
      whileHover={!isDisabled ? "hover" : undefined}
      whileTap={!isDisabled ? "tap" : undefined}
      type={type}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      className={cn(
        "inline-flex items-center gap-2.5",
        "rounded-lg font-semibold text-sm",
        "relative overflow-hidden cursor-pointer",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-b before:from-white/8 before:to-transparent",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#0072BC]/50 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3",
        variant === "primary" && "bg-[#0072BC] text-white",
        variant === "shimmer" && "bg-[#0072BC] text-white",
        variant === "cta-blue" && "bg-[#003d6b] text-white",
        isSuccess && "bg-emerald-600",
        "w-full",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="animate-pulse">Chargement...</span>
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          {children}
        </>
      ) : (
        <>
          {children}
          {showIcon && !isSuccess && <ArrowRight className="h-4 w-4" />}
        </>
      )}
    </motion.button>
  );

  if (href && !isDisabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================================
// 2. OUTLINE BUTTON
// ============================================================

interface MarketplaceButtonOutlineProps {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
  href?: string;
  onClick?: () => void;
  size?: "default" | "lg";
}

export function MarketplaceButtonOutline({
  children,
  className,
  isLoading = false,
  isSuccess = false,
  href,
  onClick,
  size = "default",
}: MarketplaceButtonOutlineProps) {
  const [hovered, setHovered] = React.useState(false);
  const isDisabled = isLoading || isSuccess;

  const content = (
    <motion.div
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5",
        "rounded-lg border-[1.5px]",
        "font-semibold overflow-hidden cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#0072BC]/50 focus-visible:ring-offset-2",
        "w-full",
        size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm",
        isSuccess
          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
          : "border-[#0072BC]",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onHoverStart={() => !isDisabled && setHovered(true)}
      onHoverEnd={() => !isDisabled && setHovered(false)}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      onClick={!isDisabled ? onClick : undefined}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      {!isSuccess && (
        <motion.span
          className="absolute inset-0 bg-[#0072BC]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.3, ease: customEase }}
          style={{ originX: 0 }}
        />
      )}
      <motion.span
        className="relative z-10 flex items-center gap-2.5"
        animate={{
          color: isSuccess ? "#059669" : hovered ? "#fff" : "#0072BC",
        }}
        transition={{ duration: 0.2 }}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        {isLoading ? "Chargement..." : children}
      </motion.span>
    </motion.div>
  );

  if (href && !isDisabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================================
// 3. OUTLINE GHOST - Fond sombre
// ============================================================

interface MarketplaceButtonGhostProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function MarketplaceButtonGhost({
  children,
  className,
  href,
  onClick,
}: MarketplaceButtonGhostProps) {
  const [hovered, setHovered] = React.useState(false);

  const content = (
    <motion.div
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5",
        "px-6 py-3 rounded-lg border-[1.5px] border-white/30",
        "text-sm font-semibold overflow-hidden cursor-pointer",
        "text-white bg-transparent",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-white/50 focus-visible:ring-offset-2",
        "w-full",
        className
      )}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <motion.span
        className="absolute inset-0 bg-white"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: customEase }}
        style={{ originX: 0 }}
      />
      <motion.span
        className="relative z-10"
        animate={{ color: hovered ? "#1a1a2e" : "#fff" }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================================
// 4. GHOST TEXT LINK
// ============================================================

interface MarketplaceButtonLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function MarketplaceButtonLink({
  href,
  children,
  className,
}: MarketplaceButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-[#0072BC] hover:underline underline-offset-4",
        "transition-colors duration-200 font-medium",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[#0072BC]/50 rounded",
        className
      )}
    >
      {children}
    </Link>
  );
}

// ============================================================
// 5. DANGER BUTTON
// ============================================================

interface MarketplaceButtonDangerProps {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

export function MarketplaceButtonDanger({
  children,
  className,
  isLoading = false,
  href,
  type = "button",
  disabled,
  onClick,
}: MarketplaceButtonDangerProps) {
  const isDisabled = disabled || isLoading;

  const content = (
    <motion.button
      variants={buttonBaseVariants}
      initial="initial"
      animate="animate"
      whileHover={!isDisabled ? "hover" : undefined}
      whileTap={!isDisabled ? "tap" : undefined}
      type={type}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      className={cn(
        "inline-flex items-center gap-2.5",
        "px-6 py-3 rounded-lg",
        "bg-red-600 text-white font-semibold text-sm",
        "relative overflow-hidden cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-red-500/50 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "w-full",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          {children}
        </>
      )}
    </motion.button>
  );

  if (href && !isDisabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================================
// 6. SEGMENTED CONTROL
// ============================================================

interface SegmentedOption {
  label: string;
  value: string;
}

interface MarketplaceSegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarketplaceSegmentedControl({
  options,
  value,
  onChange,
  className,
}: MarketplaceSegmentedControlProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1",
        className
      )}
    >
      {options.map((option) => (
        <motion.button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072BC]/50",
            value === option.value
              ? "text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
          whileTap={{ scale: 0.95 }}
        >
          {value === option.value && (
            <motion.span
              layoutId="segmented-bg"
              className="absolute inset-0 bg-[#0072BC] rounded-md"
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ============================================================
// 7. PILL/CHIP
// ============================================================

interface MarketplacePillProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function MarketplacePill({
  children,
  className,
  isActive = false,
  onClick,
}: MarketplacePillProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium",
        "transition-colors duration-200 border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072BC]/50",
        isActive
          ? "bg-[#0072BC] text-white border-[#0072BC]"
          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0072BC]/50",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

// ============================================================
// 8. ICON-LEAD CARD
// ============================================================

interface MarketplaceResourceCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function MarketplaceResourceCard({
  icon,
  title,
  subtitle,
  href,
  onClick,
  className,
}: MarketplaceResourceCardProps) {
  const content = (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-gray-900",
        "cursor-pointer hover:shadow-md transition-shadow duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072BC]/50",
        className
      )}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0072BC]/10 text-[#0072BC]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}