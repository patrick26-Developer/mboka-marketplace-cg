// src/app/[locale]/(admin)/admin/dashboard/page.tsx
import { useTranslations } from "next-intl";
import { StatsCard } from "@/components/admin/StatsCard";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { Users, Store, ShoppingCart, DollarSign } from "lucide-react";
import { formatFCFA } from "@/lib/utils/format";
import { AdminService } from "@/lib/services/admin.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const t = useTranslations();

  // ✅ VRAIES DONNÉES depuis la DB
  const stats = await AdminService.getGlobalStats();
  const recentOrders = await AdminService.getRecentOrders(10);

  const statsCards = [
    {
      title: t("admin.stats.totalUsers"),
      value: stats.totalUsers.toLocaleString("fr-FR"),
      icon: Users,
      trend: stats.trends.users,
    },
    {
      title: t("admin.stats.totalShops"),
      value: stats.totalShops.toString(),
      icon: Store,
      trend: undefined, // Pas de trend pour les boutiques (toujours 3)
    },
    {
      title: t("admin.stats.totalOrders"),
      value: stats.totalOrders.toLocaleString("fr-FR"),
      icon: ShoppingCart,
      trend: stats.trends.orders,
    },
    {
      title: t("admin.stats.totalRevenue"),
      value: formatFCFA(stats.totalRevenue),
      icon: DollarSign,
      trend: stats.trends.revenue,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("nav.dashboard")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de la plateforme Marketplace CG
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={stat.title} {...stat} index={index} />
        ))}
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("admin.recentOrders")}
        </h2>
        <RecentOrdersTable orders={recentOrders} />
      </div>
    </div>
  );
}