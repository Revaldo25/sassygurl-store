import { useEffect, useRef, useCallback } from "react";
import { useSearchStore } from "@/stores/searchStore";

/**
 * Custom hook for optimized search with debouncing
 * Prevents excessive filtering on every keystroke
 */
export function useOptimizedSearch(debounceMs: number = 300) {
  const { query, allProducts, setQuery, updateFilteredProducts } = useSearchStore();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced update of filtered products
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateFilteredProducts();
    }, debounceMs);
  }, [debounceMs, updateFilteredProducts]);

  // Trigger debounced update when query changes
  useEffect(() => {
    debouncedUpdate();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debouncedUpdate]);

  // Memoized search results with capped limit
  const memoizedResults = useCallback(() => {
    const lowerQuery = query.toLowerCase();
    if (!lowerQuery) return [];

    const results = allProducts
      .filter(
        (product) =>
          product.gameName.toLowerCase().includes(lowerQuery) ||
          product.sku.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10); // Cap results at 10 for performance

    return results;
  }, [query, allProducts]);

  return {
    query,
    setQuery,
    results: memoizedResults(),
    totalResults: allProducts.filter(
      (p) =>
        p.gameName.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
    ).length,
  };
}
