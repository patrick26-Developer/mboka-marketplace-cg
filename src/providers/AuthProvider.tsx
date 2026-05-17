// src/providers/AuthProvider.tsx
"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.data);
        }
      } catch {
        // Utilisateur non connecté
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [setUser, setLoading]);

  return <>{children}</>;
}