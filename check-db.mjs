import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    
    // Check if tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    console.log("📊 Existing tables:", tables.map((t) => Object.values(t)[0]));
    
    // Check if payment_categories table exists
    const tableExists = tables.some((t) => Object.values(t)[0] === "payment_categories");
    
    if (!tableExists) {
      console.log("\n⚠️  Database tables don't exist. Please run migrations first.");
      console.log("Run: pnpm drizzle-kit push");
    } else {
      console.log("\n✅ Database tables exist!");
      
      // Check payment_categories count
      const [categories] = await connection.execute("SELECT COUNT(*) as count FROM payment_categories");
      console.log("Payment categories count:", categories[0].count);
    }
    
    await connection.end();
  } catch (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
