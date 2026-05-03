import { create } from "zustand";

export interface LoyaltyTransaction {
  id: number;
  transactionType: "EARN" | "REDEEM";
  pointsAmount: number;
  relatedOrderId?: number;
  createdAt: Date;
  description: string;
}

interface LoyaltyState {
  // Balance
  sassyPointsBalance: number;
  setSassyPointsBalance: (balance: number) => void;

  // History
  history: LoyaltyTransaction[];
  setHistory: (history: LoyaltyTransaction[]) => void;
  addTransaction: (transaction: LoyaltyTransaction) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Calculations
  calculatePointsEarned: (amountSpent: number) => number;
  calculateDiscountFromPoints: (pointsToRedeem: number) => number;
}

/**
 * SassyPoints Loyalty System
 * - Earn 100 points for every IDR 10,000 spent
 * - 1 point = IDR 100 discount
 * - Points accumulate and can be redeemed on future transactions
 */
export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  // Balance
  sassyPointsBalance: 0,
  setSassyPointsBalance: (balance: number) => set({ sassyPointsBalance: balance }),

  // History
  history: [],
  setHistory: (history: LoyaltyTransaction[]) => set({ history }),
  addTransaction: (transaction: LoyaltyTransaction) =>
    set((state) => ({
      history: [transaction, ...state.history],
    })),

  // UI State
  isLoading: false,
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  error: null,
  setError: (error: string | null) => set({ error }),

  // Calculations
  /**
   * Calculate SassyPoints earned from spending
   * Formula: (amountSpent / 10000) * 100
   * Example: Spend Rp 100,000 → Earn 1000 points
   */
  calculatePointsEarned: (amountSpent: number) => {
    return Math.floor((amountSpent / 10000) * 100);
  },

  /**
   * Calculate discount from redeeming points
   * Formula: pointsToRedeem * 100
   * Example: Redeem 1000 points → Get Rp 100,000 discount
   */
  calculateDiscountFromPoints: (pointsToRedeem: number) => {
    return pointsToRedeem * 100;
  },
}));
