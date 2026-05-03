/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// UI-specific types
export interface AdminFeeCalculationResult {
  productPrice: number;
  adminFee: number;
  totalAmount: number;
  paymentMethod: any;
}

export interface PaymentMethodsResponse {
  categories: any[];
  methods: any[];
}

export interface TransactionHistoryResponse {
  logs: any[];
  total: number;
}

export interface RevenueStatsResponse {
  revenue: number;
  transactions: number;
  topProducts: Array<{
    productId: number;
    gameName: string;
    revenue: number;
    count: number;
  }>;
}
