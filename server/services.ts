import { z } from "zod";
import {
  getPaymentMethodsByCategory,
  getAllPaymentMethods,
  getPaymentMethodById,
  incrementPaymentMethodUsage,
  getPaymentCategories,
  getProviderStatus,
  getAllProviderStatus,
  updateProviderStatus,
  getActiveProducts,
  getProductById,
  getActiveFlashSales,
  createTransaction,
  getTransactionById,
  getUserTransactions,
  updateTransactionStatus,
  markTransactionWhatsappSent,
  getUserLoyaltyBalance,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
  getLoyaltyHistory,
} from "./db";

// ============= VALIDATION SCHEMAS =============

export const AdminFeeCalculationSchema = z.object({
  paymentMethodId: z.number().int().positive(),
  productPrice: z.number().int().positive(),
});

export const TransactionCreationSchema = z.object({
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
  paymentMethodId: z.number().int().positive(),
  sassyPointsRedeemed: z.number().int().nonnegative().default(0),
});

// ============= PAYMENT SERVICE =============

export class PaymentService {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async getPaymentMethodsWithStatus(categoryId?: number) {
    const cacheKey = `payment_methods_${categoryId || "all"}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    let methods;
    if (categoryId) {
      methods = await getPaymentMethodsByCategory(categoryId);
    } else {
      methods = await getAllPaymentMethods();
    }

    const categories = await getPaymentCategories();
    const providerStatuses = await getAllProviderStatus();

    const result = {
      categories,
      methods: methods.map((method) => ({
        ...method,
        providerStatus: providerStatuses.find(
          (ps) => ps.providerName === method.name.split(" ")[0]
        ),
      })),
    };

    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  static clearCache() {
    this.cache.clear();
  }
}

// ============= ADMIN FEE CALCULATOR =============

export class AdminFeeCalculator {
  static calculateTotalAmount(
    productPrice: number,
    adminFee: number
  ): number {
    return productPrice + adminFee;
  }

  static calculateDiscount(
    totalAmount: number,
    discountPercentage: number
  ): number {
    return Math.floor(totalAmount * (discountPercentage / 100));
  }

  static calculateFinalAmount(
    productPrice: number,
    adminFee: number,
    discountPercentage: number = 0
  ): number {
    const totalAmount = this.calculateTotalAmount(productPrice, adminFee);
    const discount = this.calculateDiscount(totalAmount, discountPercentage);
    return totalAmount - discount;
  }
}

// ============= LOYALTY SERVICE =============

export class LoyaltyService {
  static readonly POINTS_PER_10K_IDR = 100;

  static calculatePointsEarned(amount: number): number {
    return Math.floor((amount / 10000) * this.POINTS_PER_10K_IDR);
  }

  async getUserPoints(userId: number): Promise<number> {
    return getUserLoyaltyBalance(userId);
  }

  async earnPoints(
    userId: number,
    amount: number,
    orderId?: number
  ): Promise<void> {
    const points = LoyaltyService.calculatePointsEarned(amount);
    await addLoyaltyPoints(userId, points, orderId, {
      amount,
      earnedAt: new Date().toISOString(),
    });
  }

  async redeemPoints(
    userId: number,
    points: number,
    orderId?: number
  ): Promise<boolean> {
    return redeemLoyaltyPoints(userId, points, orderId, {
      redeemedAt: new Date().toISOString(),
    });
  }

  async getPointsHistory(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ) {
    return getLoyaltyHistory(userId, limit, offset);
  }
}

// ============= TRANSACTION SERVICE =============

export class TransactionService {
  private loyaltyService = new LoyaltyService();

  async createTransaction(payload: {
    userId: number;
    productId: number;
    paymentMethodId: number;
    sassyPointsRedeemed: number;
  }) {
    // Validate input
    const validated = TransactionCreationSchema.parse(payload);

    // Get product and payment method
    const product = await getProductById(validated.productId);
    if (!product) throw new Error("Product not found");

    const paymentMethod = await getPaymentMethodById(
      validated.paymentMethodId
    );
    if (!paymentMethod) throw new Error("Payment method not found");

    // Calculate amounts
    const orderAmount = Number(product.basePrice);
    const adminFee = Number(paymentMethod.adminFee);
    const totalAmount = orderAmount + adminFee;

    // Calculate loyalty points
    const pointsEarned = LoyaltyService.calculatePointsEarned(totalAmount);
    const pointsRedeemed = validated.sassyPointsRedeemed;

    // Verify user has enough points to redeem
    if (pointsRedeemed > 0) {
      const userBalance = await this.loyaltyService.getUserPoints(
        validated.userId
      );
      if (userBalance < pointsRedeemed) {
        throw new Error("Insufficient loyalty points");
      }
    }

    // Create transaction
    const transaction = await createTransaction({
      userId: validated.userId,
      productId: validated.productId,
      paymentMethodId: validated.paymentMethodId,
      orderAmount,
      adminFee,
      totalAmount,
      sassyPointsEarned: pointsEarned,
      sassyPointsRedeemed: pointsRedeemed,
    });

    // Update payment method usage
    await incrementPaymentMethodUsage(validated.paymentMethodId);

    // Clear cache
    PaymentService.clearCache();

    return transaction;
  }

  async confirmTransaction(transactionId: number) {
    const transaction = await getTransactionById(transactionId);
    if (!transaction) throw new Error("Transaction not found");

    // Update transaction status
    await updateTransactionStatus(transactionId, "CONFIRMED");

    // Award loyalty points
    if (Number(transaction.sassyPointsEarned) > 0) {
      await this.loyaltyService.earnPoints(
        transaction.userId,
        Number(transaction.totalAmount),
        transactionId
      );
    }

    // Redeem points if applicable
    if (Number(transaction.sassyPointsRedeemed) > 0) {
      await this.loyaltyService.redeemPoints(
        transaction.userId,
        Number(transaction.sassyPointsRedeemed),
        transactionId
      );
    }

    return getTransactionById(transactionId);
  }

  async failTransaction(transactionId: number) {
    await updateTransactionStatus(transactionId, "FAILED");
    return getTransactionById(transactionId);
  }

  async markWhatsappSent(transactionId: number) {
    await markTransactionWhatsappSent(transactionId);
  }

  async getUserTransactionHistory(userId: number, limit: number = 50, offset: number = 0) {
    return getUserTransactions(userId, limit, offset);
  }
}

// ============= PROVIDER STATUS SERVICE =============

export class ProviderStatusService {
  async getProviderStatus(providerName: string) {
    return getProviderStatus(providerName);
  }

  async getAllProviderStatus() {
    return getAllProviderStatus();
  }

  async updateProviderStatus(
    providerName: string,
    isOnline: boolean,
    statusMessage?: string
  ) {
    await updateProviderStatus(providerName, isOnline, statusMessage);
    PaymentService.clearCache();
  }

  async checkAndBroadcastStatus(io: any) {
    // This would be called by a background job or webhook
    // to check provider status and broadcast updates via Socket.io
    const statuses = await getAllProviderStatus();
    
    // Emit to all connected clients
    io.emit("provider_status_update", statuses);
    
    return statuses;
  }
}

// ============= PRODUCT SERVICE =============

export class ProductService {
  async getActiveProducts() {
    return getActiveProducts();
  }

  async getFlashSales() {
    return getActiveFlashSales();
  }

  async getProductWithFlashSale(productId: number) {
    const product = await getProductById(productId);
    if (!product) return null;

    const flashSales = await getActiveFlashSales();
    const flashSale = flashSales.find((fs) => fs.productId === productId);

    return {
      ...product,
      flashSale: flashSale || null,
    };
  }
}
