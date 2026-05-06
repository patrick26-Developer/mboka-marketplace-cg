"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductFilters, ProductWithRelations } from "@/types";

export function useProducts(filters?: ProductFilters, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["products", filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.shopId && { shopId: filters.shopId }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.search && { search: filters.search }),
      });

      const res = await fetch(`/api/v1/products?${params}`);
      if (!res.ok) throw new Error("Erreur chargement produits");
      return res.json();
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${slug}`);
      if (!res.ok) throw new Error("Produit introuvable");
      return res.json();
    },
    enabled: !!slug,
  });
}