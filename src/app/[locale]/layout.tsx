// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, defaultLocale } from "@/i18n/config";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Link from "next/link";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    fr: "Marketplace CG - Made in Congo-Brazzaville 🇨🇬",
    en: "Marketplace CG - Made in Congo-Brazzaville 🇨🇬",
  };
  return {
    title: titles[locale] || titles[defaultLocale],
    description: locale === "fr"
      ? "Plateforme e-commerce congolaise"
      : "Congolese e-commerce platform",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as typeof locales[number])) {
    notFound();
  }

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-lg font-bold tracking-tight">
            Marketplace<span className="text-[#e94560]">CG</span> 🇨🇬
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>© 2026 Marketplace CG — Made in Congo-Brazzaville 🇨🇬</p>
      </footer>
    </div>
  );
}