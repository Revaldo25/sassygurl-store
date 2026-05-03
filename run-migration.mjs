import fs from "fs";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function runMigration() {
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    
    // Read migration SQL
    const sql = fs.readFileSync("./drizzle/0001_short_thunderbird.sql", "utf-8");
    
    // Split by statement-breakpoint
    const statements = sql.split("--> statement-breakpoint").filter((s) => s.trim());
    
    console.log(`🔄 Running ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await connection.execute(trimmed);
          console.log("✅", trimmed.substring(0, 50) + "...");
        } catch (e) {
          if (e.code === "ER_TABLE_EXISTS_ERROR") {
            console.log("⏭️  Table already exists, skipping...");
          } else {
            throw e;
          }
        }
      }
    }
    
    console.log("\n✅ Migration completed!");
    await connection.end();
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    process.exit(1);
  }
}

runMigration();
