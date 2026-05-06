"use client";

import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { formatFCFA } from "@/lib/utils/format";

export function useCart() {
  const cart = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const addToCart = useCallback(
    (item: {
      productId: string;
      productName: string;  // ✅ CORRIGÉ (était name)
      productImage: string | null;
      shopId: string;
      price: number;
      stock: number;
    }) => {
      if (!isAuthenticated) {
        toast.error("Connectez-vous pour ajouter au panier");
        router.push("/auth/login");
        return;
      }

      if (item.stock <= 0) {
        toast.error("Produit en rupture de stock");
        return;
      }

      // Vérifier conflit de boutique
      if (cart.items.length > 0 && cart.items[0].shopId !== item.shopId) {
        toast.error(
          "Votre panier contient des articles d'une autre boutique. Videz-le d'abord."
        );
        return;
      }

      cart.addItem({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        shopId: item.shopId,
        quantity: 1,
        priceSnapshot: item.price,
        stock: item.stock,
      });

      toast.success(`${item.productName} ajouté au panier ✅`);
    },
    [cart, isAuthenticated, router]
  );

  return {
    items: cart.items,
    itemsCount: cart.getTotalItems(),     // ✅ CORRIGÉ
    totalFormatted: formatFCFA(cart.getTotalPrice()),
    totalRaw: cart.getTotalPrice(),
    addToCart,
    removeItem: cart.removeItem,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
  };
}