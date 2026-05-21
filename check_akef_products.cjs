const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  const res = await client.query('SELECT count(*) FROM "Product" WHERE "gameId" = $1', ['b0798322-6d78-4ea2-b8f9-b4dbe0e7aa1a']);
  const count = parseInt(res.rows[0].count);
  console.log('Arknights Endfield Products count:', count);
  
  if (count === 0) {
    console.log("Seeding products for Arknights: Endfield...");
    const provResult = await client.query('SELECT id FROM "Provider" LIMIT 1');
    const providerId = provResult.rows[0].id;
    
    const products = [
      { sku: "AKEF-12", name: "12 Origeometry", price: 3000, originalPrice: 3500 },
      { sku: "AKEF-68", name: "68 Origeometry", price: 16000, originalPrice: 18000 },
      { sku: "AKEF-184", name: "184 Origeometry", price: 45000, originalPrice: 50000 },
      { sku: "AKEF-MONTHLY", name: "Monthly Pass", price: 79000, originalPrice: 85000 }
    ];

    for (const p of products) {
      const prodId = require('crypto').randomUUID();
      await client.query(`
        INSERT INTO "Product" (
          "id", "gameId", "providerId", "sku", "name", "description", "source", 
          "priceModal", "priceSell", "priceMember", "priceReseller", "priceVip", 
          "originalPrice", "isActive", "isFlashSale", "stock", "cleanName", "margin", "originalName"
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'VIP'::"ProviderSource", $7, $8, $9, $10, $11, $12, true, false, 99999, $13, 0.00, $14)
      `, [
        prodId,
        'b0798322-6d78-4ea2-b8f9-b4dbe0e7aa1a',
        providerId,
        p.sku,
        p.name,
        `Top up ${p.name}`,
        p.price,
        p.price,
        p.price,
        p.price,
        p.price,
        p.originalPrice,
        p.name,
        p.name
      ]);
    }
    console.log("Products seeded successfully.");
  }
  await client.end();
}

run().catch(console.error);
