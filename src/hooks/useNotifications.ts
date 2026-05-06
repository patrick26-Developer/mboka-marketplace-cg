"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/notifications?page=${page}`);
      if (!res.ok) throw new Error("Erreur notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refresh toutes les 30s
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}