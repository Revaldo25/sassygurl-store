import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { paymentCategories, paymentMethods, providerStatus } from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seed() {
  try {
    // Create connection
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("🌱 Starting seed data insertion...");

    // Insert payment categories
    const categories = [
      { name: "QRIS", displayOrder: 1 },
      { name: "E-Wallet", displayOrder: 2 },
      { name: "Virtual Account", displayOrder: 3 },
      { name: "Retail Outlet", displayOrder: 4 },
    ];

    const insertedCategories = await db
      .insert(paymentCategories)
      .values(categories)
      .then(() => categories);

    console.log("✅ Payment categories inserted");

    // Get category IDs
    const categoryMap = new Map();
    const allCategories = await db.select().from(paymentCategories);
    allCategories.forEach((cat) => {
      categoryMap.set(cat.name, cat.id);
    });

    // Insert payment methods
    const paymentMethodsData = [
      // QRIS
      {
        name: "QRIS",
        categoryId: categoryMap.get("QRIS"),
        logoUrl: "/manus-storage/qris.webp",
        adminFee: 0,
        isActive: true,
        usageCount: 1500,
      },

      // E-Wallets
      {
        name: "GoPay",
        categoryId: categoryMap.get("E-Wallet"),
        logoUrl: "/manus-storage/gopay.webp",
        adminFee: 2500,
        isActive: true,
        usageCount: 3200,
      },
      {
        name: "OVO",
        categoryId: categoryMap.get("E-Wallet"),
        logoUrl: "/manus-storage/ovo.webp",
        adminFee: 2500,
        isActive: true,
        usageCount: 2800,
      },
      {
        name: "Dana",
        categoryId: categoryMap.get("E-Wallet"),
        logoUrl: "/manus-storage/dana.webp",
        adminFee: 3000,
        isActive: true,
        usageCount: 1900,
      },
      {
        name: "LinkAja",
        categoryId: categoryMap.get("E-Wallet"),
        logoUrl: "/manus-storage/linkaja.webp",
        adminFee: 2500,
        isActive: true,
        usageCount: 1200,
      },

      // Virtual Accounts
      {
        name: "BCA Virtual Account",
        categoryId: categoryMap.get("Virtual Account"),
        logoUrl: "/manus-storage/bca.webp",
        adminFee: 4000,
        isActive: true,
        usageCount: 2500,
      },
      {
        name: "BNI Virtual Account",
        categoryId: categoryMap.get("Virtual Account"),
        logoUrl: "/manus-storage/bni.webp",
        adminFee: 4000,
        isActive: true,
        usageCount: 2100,
      },
      {
        name: "Mandiri Virtual Account",
        categoryId: categoryMap.get("Virtual Account"),
        logoUrl: "/manus-storage/mandiri.webp",
        adminFee: 4000,
        isActive: true,
        usageCount: 1800,
      },
      {
        name: "Permata Virtual Account",
        categoryId: categoryMap.get("Virtual Account"),
        logoUrl: "/manus-storage/permata.webp",
        adminFee: 4500,
        isActive: true,
        usageCount: 900,
      },

      // Retail Outlets
      {
        name: "Indomaret",
        categoryId: categoryMap.get("Retail Outlet"),
        logoUrl: "/manus-storage/indomaret.webp",
        adminFee: 5000,
        isActive: true,
        usageCount: 1400,
      },
      {
        name: "Alfamart",
        categoryId: categoryMap.get("Retail Outlet"),
        logoUrl: "/manus-storage/alfamart.webp",
        adminFee: 5000,
        isActive: true,
        usageCount: 1100,
      },
    ];

    await db.insert(paymentMethods).values(paymentMethodsData);
    console.log("✅ Payment methods inserted");

    // Insert provider status
    const providers = [
      { providerName: "Digiflazz", isOnline: true, statusMessage: "Online" },
      { providerName: "Antigravity", isOnline: true, statusMessage: "Online" },
      { providerName: "Agen Pulsa", isOnline: true, statusMessage: "Online" },
    ];

    await db.insert(providerStatus).values(providers);
    console.log("✅ Provider status inserted");

    console.log("🎉 Seed data insertion completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
