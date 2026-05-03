import { create } from "zustand";
import { z } from "zod";

export const PaymentMethodSchema = z.object({
  id: z.number(),
  name: z.string(),
  categoryId: z.number(),
  logoUrl: z.string(),
  adminFee: z.number(),
  isActive: z.boolean(),
  usageCount: z.number(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export interface PaymentStore {
  // Selection state
  selectedMethodId: number | null;
  selectedProductPrice: number | null;
  calculatedFee: number | null;
  totalAmount: number | null;

  // Search and filter state
  searchQuery: string;
  filteredMethods: PaymentMethod[];
  allMethods: PaymentMethod[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  selectPaymentMethod: (methodId: number, productPrice: number) => void;
  deselectPaymentMethod: () => void;
  setSearchQuery: (query: string) => void;
  setAllMethods: (methods: PaymentMethod[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  calculateTotal: (productPrice: number, adminFee: number) => number;
}

export const usePaymentStore = create<PaymentStore>((set: any, get: any) => ({
  selectedMethodId: null,
  selectedProductPrice: null,
  calculatedFee: null,
  totalAmount: null,
  searchQuery: "",
  filteredMethods: [],
  allMethods: [],
  isLoading: false,
  error: null,

  selectPaymentMethod: (methodId: number, productPrice: number) => {
    const state = get();
    const method = state.allMethods.find((m: PaymentMethod) => m.id === methodId);

    if (!method) {
      set({ error: "Payment method not found" });
      return;
    }

    const total = productPrice + method.adminFee;

    set({
      selectedMethodId: methodId,
      selectedProductPrice: productPrice,
      calculatedFee: method.adminFee,
      totalAmount: total,
      error: null,
    });
  },

  deselectPaymentMethod: () => {
    set({
      selectedMethodId: null,
      selectedProductPrice: null,
      calculatedFee: null,
      totalAmount: null,
    });
  },

  setSearchQuery: (query: string) => {
    const state = get();
    set({ searchQuery: query });

    // Filter methods by name (case-insensitive)
    if (query.trim() === "") {
      set({ filteredMethods: state.allMethods });
    } else {
      const filtered = state.allMethods.filter((method: PaymentMethod) =>
        method.name.toLowerCase().includes(query.toLowerCase())
      );
      set({ filteredMethods: filtered });
    }
  },

  setAllMethods: (methods: PaymentMethod[]) => {
    set({
      allMethods: methods,
      filteredMethods: methods,
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  calculateTotal: (productPrice: number, adminFee: number) => {
    return productPrice + adminFee;
  },
}));
