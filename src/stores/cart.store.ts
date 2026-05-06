import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ✅ Type complet avec tous les champs nécessaires
interface CartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  shopId: string;        // ✅ AJOUTÉ
  quantity: number;
  priceSnapshot: number;
  stock: number;         // ✅ Pour validation côté client
  addedAt: Date;
}

interface CartState {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, "addedAt">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Getters
  getTotalItems: () => number;  // ✅ AJOUTÉ
  getTotalPrice: () => number;
  getItem: (productId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.productId === item.productId
          );

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + item.quantity, item.stock) }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, { ...item, addedAt: new Date() }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.priceSnapshot * item.quantity,
          0
        );
      },

      getItem: (productId) => {
        return get().items.find((i) => i.productId === productId);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);