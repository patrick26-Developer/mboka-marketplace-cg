// src/components/layouts/ShopLayout.tsx
"use client";

import { ShopSidebar } from "@/components/navigation/ShopSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ShopLayoutProps {
  children: React.ReactNode;
  shopName: string;
  shopType: string;
  lowStockCount?: number;
}

export function ShopLayout({ children, shopName, shopType, lowStockCount }: ShopLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <ShopSidebar shopName={shopName} shopType={shopType} lowStockCount={lowStockCount} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="hover:bg-accent/50 transition-colors duration-200" />

              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-accent/50 transition-colors duration-200"
                  >
                    <Bell className="h-5 w-5" />
                    {(lowStockCount ?? 0) > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {lowStockCount}
                      </Badge>
                    )}
                  </Button>
                </motion.div>

                <ThemeToggle />
                <LocaleSwitcher />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}