// src/stores/auth.store.ts
"use client";

import { create }              from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserPublic }     from "@/types";

// ============================================================
// ⚠️  RÈGLE DE SÉCURITÉ CRITIQUE
// Les accessToken et refreshToken sont dans des cookies httpOnly
// Le store Zustand ne garde QUE les données publiques de l'user
// ============================================================

interface AuthState {
  user:            UserPublic | null;
  isAuthenticated: boolean;
  isLoading:       boolean;

  setUser:    (user: UserPublic)                  => void;
  updateUser: (updates: Partial<UserPublic>)       => void;
  clearAuth:  ()                                   => void;
  setLoading: (isLoading: boolean)                 => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,

      setUser: (user) =>
        set({ user, isAuthenticated: true, isLoading: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearAuth: () =>
        set({ user: null, isAuthenticated: false, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name:    "mcg-user",
      storage: createJSONStorage(() => localStorage),
      // ✅ Seulement les données non-sensibles
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);