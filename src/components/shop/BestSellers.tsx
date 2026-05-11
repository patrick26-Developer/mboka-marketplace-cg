// src/components/shop/BestSellers.tsx
"use client";

import { TrendingUp, Package2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import { formatFCFA } from "@/lib/utils/format";
import Link from "next/link";

interface BestSellerProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  orderCount: number;
  stock: number;
}

interface BestSellersProps {
  products: BestSellerProduct[];
}

export function BestSellers({ products }: BestSellersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Meilleures Ventes
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
                  <p className="text-sm text-muted-foreground">
                    {formatFCFA(product.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    {product.orderCount} ventes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.stock}
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