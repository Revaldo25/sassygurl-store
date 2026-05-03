import { create } from "zustand";

export interface Product {
  id: number;
  gameName: string;
  sku: string;
  basePrice: number;
  logoUrl: string;
  isActive: boolean;
  category: "TOPUP" | "VOUCHER";
}

interface SearchState {
  // Search Query
  query: string;
  setQuery: (query: string) => void;

  // Products
  allProducts: Product[];
  setAllProducts: (products: Product[]) => void;

  // Filtered Results
  filteredProducts: Product[];
  updateFilteredProducts: () => void;

  // UI State
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Selected Product
  selectedProduct: Product | null;
  selectProduct: (product: Product) => void;
  clearSelection: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  // Search Query
  query: "",
  setQuery: (query: string) => {
    set({ query });
    // Auto-update filtered products when query changes
    setTimeout(() => get().updateFilteredProducts(), 0);
  },

  // Products
  allProducts: [],
  setAllProducts: (products: Product[]) => set({ allProducts: products }),

  // Filtered Results
  filteredProducts: [],
  updateFilteredProducts: () => {
    const { query, allProducts } = get();

    if (query.trim() === "") {
      set({ filteredProducts: [] });
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allProducts.filter(
      (product) =>
        product.gameName.toLowerCase().includes(lowerQuery) ||
        product.sku.toLowerCase().includes(lowerQuery)
    );

    set({ filteredProducts: filtered });
  },

  // UI State
  isOpen: false,
  setIsOpen: (open: boolean) => set({ isOpen: open }),
  isLoading: false,
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // Selected Product
  selectedProduct: null,
  selectProduct: (product: Product) => {
    set({ selectedProduct: product });
  },
  clearSelection: () => {
    set({ selectedProduct: null, query: "", filteredProducts: [] });
  },
}));
