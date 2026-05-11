// src/components/shop/StockAlert.tsx
"use client";

import { AlertTriangle, Package2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  lowStockAlert: number;
  thumbnail: string | null;
  sku: string | null;
}

interface StockAlertProps {
  products: LowStockProduct[];
}

export function StockAlert({ products }: StockAlertProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Alertes Stock Bas ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/shop/products/${product.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200 group"
              >
                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors duration-200">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {product.sku ?? "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-destructive">
                    {product.stock} unités
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Seuil: {product.lowStockAlert}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}