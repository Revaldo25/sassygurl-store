import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  sassyPointsBalance: decimal("sassyPointsBalance", { precision: 12, scale: 0 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Payment Categories
export const paymentCategories = mysqlTable("payment_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayOrder: int("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentCategory = typeof paymentCategories.$inferSelect;
export type InsertPaymentCategory = typeof paymentCategories.$inferInsert;

// Payment Methods
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  categoryId: int("categoryId").notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }).notNull(),
  adminFee: decimal("adminFee", { precision: 12, scale: 0 }).notNull().default("0"),
  isActive: boolean("isActive").notNull().default(true),
  usageCount: int("usageCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

// Provider Status
export const providerStatus = mysqlTable("provider_status", {
  id: int("id").autoincrement().primaryKey(),
  providerName: varchar("providerName", { length: 100 }).notNull().unique(),
  isOnline: boolean("isOnline").notNull().default(true),
  statusMessage: text("statusMessage"),
  lastCheckedAt: timestamp("lastCheckedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderStatus = typeof providerStatus.$inferSelect;
export type InsertProviderStatus = typeof providerStatus.$inferInsert;

// Products
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  gameName: varchar("gameName", { length: 150 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  basePrice: decimal("basePrice", { precision: 12, scale: 0 }).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  category: mysqlEnum("category", ["TOPUP", "VOUCHER"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Flash Sales
export const flashSales = mysqlTable("flash_sales", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  stockLimit: int("stockLimit"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FlashSale = typeof flashSales.$inferSelect;
export type InsertFlashSale = typeof flashSales.$inferInsert;

// Transactions
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  paymentMethodId: int("paymentMethodId").notNull(),
  orderAmount: decimal("orderAmount", { precision: 12, scale: 0 }).notNull(),
  adminFee: decimal("adminFee", { precision: 12, scale: 0 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 0 }).notNull(),
  sassyPointsEarned: decimal("sassyPointsEarned", { precision: 12, scale: 0 }).notNull().default("0"),
  sassyPointsRedeemed: decimal("sassyPointsRedeemed", { precision: 12, scale: 0 }).notNull().default("0"),
  status: mysqlEnum("status", ["PENDING", "CONFIRMED", "FAILED"]).notNull().default("PENDING"),
  whatsappSent: boolean("whatsappSent").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// Loyalty History
export const loyaltyHistory = mysqlTable("loyalty_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transactionType: mysqlEnum("transactionType", ["EARN", "REDEEM"]).notNull(),
  pointsAmount: decimal("pointsAmount", { precision: 12, scale: 0 }).notNull(),
  relatedOrderId: int("relatedOrderId"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyHistory = typeof loyaltyHistory.$inferSelect;
export type InsertLoyaltyHistory = typeof loyaltyHistory.$inferInsert;