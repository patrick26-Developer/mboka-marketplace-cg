"use client";

import { useTranslate, MessageKey } from "@/hooks/useTranslate";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  Ticket,
  Activity,
  Star,
  BarChart3,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ✅ Type strict pour les items de menu
const menuItems: Array<{
  title: MessageKey;
  icon: typeof LayoutDashboard;
  href: string;
}> = [
  { title: "nav.dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "nav.users", icon: Users, href: "/admin/users" },
  { title: "nav.shops", icon: Store, href: "/admin/shops" },
  { title: "nav.orders", icon: ShoppingCart, href: "/admin/orders" },
  { title: "nav.coupons", icon: Ticket, href: "/admin/coupons" },
  { title: "nav.reviews", icon: Star, href: "/admin/reviews" },
  { title: "nav.analytics", icon: BarChart3, href: "/admin/analytics" },
  { title: "nav.logs", icon: Activity, href: "/admin/logs" },
];

export function AdminSidebar() {
  const { t } = useTranslate();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getInitials = (name: string | null) => {
    if (!name) return "AD";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Store className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">Marketplace CG</span>
            <span className="text-xs text-muted-foreground">{t("admin.title")}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          "group relative transition-colors duration-200",
                          isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-accent/50"
                        )}
                      >
                        <Link href={item.href}>
                          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                            <Icon className={cn("h-4 w-4 transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground")} />
                          </motion.div>
                          <span className="font-medium">{t(item.title)}</span>
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name ?? "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors duration-200 group"
            title={t("common.logout")}
          >
            <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors duration-200" />
          </motion.button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}