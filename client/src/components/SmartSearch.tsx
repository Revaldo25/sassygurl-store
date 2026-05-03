import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchStore } from "@/stores/searchStore";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";
import { trpc } from "@/lib/trpc";

export function SmartSearch() {
  const {
    isOpen,
    setIsOpen,
    selectProduct,
    clearSelection,
    setAllProducts,
  } = useSearchStore();

  const searchRef = useRef<HTMLDivElement>(null);

  // Use optimized search with debouncing and memoization
  const { query, setQuery, results: filteredProducts } = useOptimizedSearch(300);

  // Fetch all products
  const { data: productsData, isLoading } = trpc.products.getAll.useQuery(undefined) as any;

  // No need to track loading separately with optimized search

  useEffect(() => {
    if (productsData && Array.isArray(productsData)) {
      setAllProducts(
        productsData.map((p: any) => ({
          id: p.id,
          gameName: p.gameName,
          sku: p.sku,
          basePrice: Number(p.basePrice),
          logoUrl: p.logoUrl,
          isActive: p.isActive,
          category: p.category,
        }))
      );
    }
  }, [productsData, setAllProducts]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleSelectProduct = (productId: number) => {
    const product = filteredProducts.find((p) => p.id === productId);
    if (product) {
      selectProduct(product);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <Input
          type="text"
          placeholder="Cari game atau voucher... (e.g., ML, FF)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-indigo-400/60"
        />
        {query && (
          <motion.button
            onClick={() => clearSelection()}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && query && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-white/10 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto backdrop-blur-md"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {filteredProducts.length === 0 ? (
              <motion.div
                className="p-6 text-center text-white/60 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Tidak ada hasil untuk "{query}"
              </motion.div>
            ) : (
              <motion.div className="divide-y divide-white/10">
                {filteredProducts.map((product, index) => (
                  <motion.button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5 }}
                  >
                    {/* Product Logo */}
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img
                        src={product.logoUrl}
                        alt={product.gameName}
                        className="w-8 h-8 object-contain"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {product.gameName}
                      </p>
                      <p className="text-white/50 text-xs">
                        {product.category === "TOPUP" ? "Top-Up" : "Voucher"} •
                        Rp {product.basePrice.toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {!product.isActive && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">
                        Tidak Tersedia
                      </span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
