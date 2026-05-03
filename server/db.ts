import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  paymentMethods,
  paymentCategories,
  providerStatus,
  products,
  flashSales,
  transactions,
  loyaltyHistory,
  PaymentMethod,
  PaymentCategory,
  ProviderStatus,
  Product,
  FlashSale,
  Transaction,
  LoyaltyHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER QUERIES =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= PAYMENT METHOD QUERIES =============

export async function getPaymentMethodsByCategory(categoryId: number): Promise<PaymentMethod[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.categoryId, categoryId), eq(paymentMethods.isActive, true)))
    .orderBy(desc(paymentMethods.usageCount), paymentMethods.adminFee);
}

export async function getAllPaymentMethods(): Promise<PaymentMethod[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, true))
    .orderBy(desc(paymentMethods.usageCount), paymentMethods.adminFee);
}

export async function getPaymentMethodById(id: number): Promise<PaymentMethod | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementPaymentMethodUsage(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const method = await getPaymentMethodById(id);
  if (!method) return;

  await db
    .update(paymentMethods)
    .set({ usageCount: method.usageCount + 1 })
    .where(eq(paymentMethods.id, id));
}

// ============= PAYMENT CATEGORY QUERIES =============

export async function getPaymentCategories(): Promise<PaymentCategory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(paymentCategories).orderBy(paymentCategories.displayOrder);
}

// ============= PROVIDER STATUS QUERIES =============

export async function getProviderStatus(providerName: string): Promise<ProviderStatus | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(providerStatus)
    .where(eq(providerStatus.providerName, providerName))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProviderStatus(): Promise<ProviderStatus[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(providerStatus);
}

export async function updateProviderStatus(providerName: string, isOnline: boolean, statusMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getProviderStatus(providerName);
  
  if (existing) {
    await db
      .update(providerStatus)
      .set({ isOnline, statusMessage, lastCheckedAt: new Date() })
      .where(eq(providerStatus.providerName, providerName));
  } else {
    await db.insert(providerStatus).values({
      providerName,
      isOnline,
      statusMessage,
      lastCheckedAt: new Date(),
    });
  }
}

// ============= PRODUCT QUERIES =============

export async function getActiveProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(products).where(eq(products.isActive, true));
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= FLASH SALE QUERIES =============

export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db
    .select()
    .from(flashSales)
    .where(
      and(
        eq(flashSales.isActive, true),
        gte(flashSales.endTime, now),
        lte(flashSales.startTime, now)
      )
    );
}

// ============= TRANSACTION QUERIES =============

export async function createTransaction(transaction: {
  userId: number;
  productId: number;
  paymentMethodId: number;
  orderAmount: number;
  adminFee: number;
  totalAmount: number;
  sassyPointsEarned: number;
  sassyPointsRedeemed: number;
}): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(transactions).values({
    userId: transaction.userId,
    productId: transaction.productId,
    paymentMethodId: transaction.paymentMethodId,
    orderAmount: String(transaction.orderAmount),
    adminFee: String(transaction.adminFee),
    totalAmount: String(transaction.totalAmount),
    sassyPointsEarned: String(transaction.sassyPointsEarned),
    sassyPointsRedeemed: String(transaction.sassyPointsRedeemed),
    status: "PENDING",
  });

  const transactionId = result[0]?.insertId;
  if (!transactionId) throw new Error("Failed to create transaction");

  const created = await getTransactionById(transactionId);
  if (!created) throw new Error("Failed to retrieve created transaction");

  return created;
}

export async function getTransactionById(id: number): Promise<Transaction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTransactions(userId: number, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateTransactionStatus(id: number, status: "PENDING" | "CONFIRMED" | "FAILED"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(transactions).set({ status }).where(eq(transactions.id, id));
}

export async function markTransactionWhatsappSent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(transactions).set({ whatsappSent: true }).where(eq(transactions.id, id));
}

// ============= LOYALTY QUERIES =============

export async function getUserLoyaltyBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? Number(result[0].sassyPointsBalance) : 0;
}

export async function addLoyaltyPoints(userId: number, points: number, relatedOrderId?: number, metadata?: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Update user balance
  const currentBalance = await getUserLoyaltyBalance(userId);
  await db
    .update(users)
    .set({ sassyPointsBalance: String(currentBalance + points) })
    .where(eq(users.id, userId));

  // Record history
  await db.insert(loyaltyHistory).values({
    userId,
    transactionType: "EARN",
    pointsAmount: String(points),
    relatedOrderId,
    metadata,
  });
}

export async function redeemLoyaltyPoints(userId: number, points: number, relatedOrderId?: number, metadata?: any): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const currentBalance = await getUserLoyaltyBalance(userId);
  if (currentBalance < points) return false;

  // Update user balance
  await db
    .update(users)
    .set({ sassyPointsBalance: String(currentBalance - points) })
    .where(eq(users.id, userId));

  // Record history
  await db.insert(loyaltyHistory).values({
    userId,
    transactionType: "REDEEM",
    pointsAmount: String(points),
    relatedOrderId,
    metadata,
  });

  return true;
}

export async function getLoyaltyHistory(userId: number, limit: number = 50, offset: number = 0): Promise<LoyaltyHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(loyaltyHistory)
    .where(eq(loyaltyHistory.userId, userId))
    .orderBy(desc(loyaltyHistory.createdAt))
    .limit(limit)
    .offset(offset);
}
