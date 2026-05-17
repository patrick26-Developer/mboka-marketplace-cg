// src/app/[locale]/(shop)/shop/dashboard/page.tsx
import { useTranslate } from "@/hooks/useTranslate";
import { StatsCard } from "@/components/admin/StatsCard";
import { StockAlert } from "@/components/shop/StockAlert";
import { BestSellers } from "@/components/shop/BestSellers";
import { Package, ShoppingCart, AlertTriangle, DollarSign } from "lucide-react";
import { formatFCFA } from "@/lib/utils/format";
import { getCurrentUser } from "@/lib/auth/session";
import { ShopService } from "@/lib/services/shop.service";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopDashboardPage() {
  const {t} = useTranslate();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const shop = await ShopService.getShopByAdminId(user.sub);

  if (!shop) {
    return <div>Aucune boutique assignée</div>;
  }

  // ✅ VRAIES DONNÉES depuis la DB
  const [stats, lowStockProducts, bestSellers] = await Promise.all([
    ShopService.getShopStats(shop.id),
    ShopService.getLowStockAlerts(shop.id, 5),
    ShopService.getBestSellers(shop.id, 5),
  ]);

  const statsCards = [
    {
      title: t("shop.stats.totalProducts"),
      value: stats.totalProducts.toString(),
      icon: Package,
      trend: undefined,
    },
    {
      title: t("shop.stats.totalOrders"),
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      trend: stats.trends.orders,
    },
    {
      title: t("shop.stats.lowStock"),
      value: stats.lowStockProducts.toString(),
      icon: AlertTriangle,
      trend: undefined,
    },
    {
      title: t("shop.stats.monthRevenue"),
      value: formatFCFA(stats.monthRevenue),
      icon: DollarSign,
      trend: stats.trends.revenue,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.dashboard")}</h1>
        <p className="text-muted-foreground mt-1">Gestion de {shop.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Alerts & Best Sellers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StockAlert products={lowStockProducts} />
        <BestSellers products={bestSellers} />
      </div>
    </div>
  );
}