"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUserOrders(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["orders", "user", page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/orders?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Erreur chargement commandes");
      return res.json();
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur création commande");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commande créée avec succès !");
    },
    onError: () => {
      toast.error("Échec de la commande");
    },
  });
}