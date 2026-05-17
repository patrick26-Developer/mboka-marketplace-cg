// src/app/[locale]/(shop)/shop/layout.tsx
import { ShopLayout } from "@/components/layouts/ShopLayout";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ShopService } from "@/lib/services/shop.service";

export default async function ShopRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/shop/dashboard");
  }

  if (user.role !== "SHOP_ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // Récupérer la boutique assignée
  const shop = await ShopService.getShopByAdminId(user.sub);

  if (!shop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Aucune boutique assignée à votre compte.</p>
      </div>
    );
  }

  // Récupérer alertes stock
  const lowStockProducts = await ShopService.getLowStockAlerts(shop.id);

  return (
    <ShopLayout
      shopName={shop.name}
      shopType={shop.type}
      lowStockCount={lowStockProducts.length}
    >
      {children}
    </ShopLayout>
  );
}