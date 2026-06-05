const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

const PRODUCT_CATALOG = {
  "hsr": [
    { name: "60 Oneiric Shards", price: 15000, originalPrice: 16000 },
    { name: "300 Oneiric Shards", price: 75000, originalPrice: 80000 },
    { name: "980 Oneiric Shards", price: 230000, originalPrice: 250000 },
    { name: "Express Supply Pass", price: 75000, originalPrice: 80000 }
  ],
  "zzz": [
    { name: "60 Monochromes", price: 15000, originalPrice: 16000 },
    { name: "300 Monochromes", price: 75000, originalPrice: 80000 },
    { name: "Inter-Knot Membership", price: 75000, originalPrice: 80000 }
  ],
  "wuwa": [
    { name: "60 Astrite", price: 15000, originalPrice: 16000 },
    { name: "300 Astrite", price: 75000, originalPrice: 80000 },
    { name: "Lunite Subscription", price: 75000, originalPrice: 80000 }
  ],
  "hok": [
    { name: "16 Tokens", price: 4000, originalPrice: 4500 },
    { name: "80 Tokens", price: 20000, originalPrice: 22000 }
  ],
  "nikke": [
    { name: "320 Gems", price: 75000, originalPrice: 80000 },
    { name: "720 Gems", price: 150000, originalPrice: 160000 }
  ],
  "lol": [
    { name: "400 RP", price: 50000, originalPrice: 55000 },
    { name: "850 RP", price: 100000, originalPrice: 110000 }
  ],
  "lolwr": [
    { name: "425 Wild Cores", price: 50000, originalPrice: 55000 },
    { name: "1000 Wild Cores", price: 100000, originalPrice: 110000 }
  ],
  "roblox": [
    { name: "400 Robux", price: 75000, originalPrice: 80000 },
    { name: "800 Robux", price: 150000, originalPrice: 160000 }
  ],
  "aether-gazer": [
    { name: "70 Shifted Stars", price: 15000, originalPrice: 16000 },
    { name: "300 Shifted Stars", price: 75000, originalPrice: 80000 }
  ],
  "mccg": [
    { name: "100 Coins", price: 15000, originalPrice: 16000 },
    { name: "500 Coins", price: 75000, originalPrice: 80000 }
  ]
};

async function run() {
  await client.connect();
  
  // 1. Activate ALL games
  const res = await client.query('UPDATE "Game" SET "isActive" = true RETURNING slug, id');
  console.log('Activated games:', res.rows.map(r => r.slug).join(', '));
  
  // 2. Fetch provider ID
  const provResult = await client.query('SELECT id FROM "Provider" LIMIT 1');
  const providerId = provResult.rows[0]?.id;
  if (!providerId) throw new Error("No provider found");

  // 3. Insert mock products for newly activated games if they don't exist
  for (const game of res.rows) {
    const products = PRODUCT_CATALOG[game.slug];
    if (products) {
      for (const p of products) {
        const sku = game.slug.toUpperCase() + '-' + Math.floor(Math.random()*10000);
        await client.query(`
          INSERT INTO "Product" (
            "id", "gameId", "providerId", "sku", "name", "description", "source", 
            "priceModal", "priceSell", "priceMember", "priceReseller", "priceVip", 
            "originalPrice", "isActive", "isFlashSale", "stock", "cleanName", "margin", "originalName"
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'VIP'::"ProviderSource", $7, $8, $9, $10, $11, $12, true, false, 99999, $13, 0.00, $14)
          ON CONFLICT (slug) DO NOTHING;
        `, [
          require('crypto').randomUUID(), game.id, providerId, sku, p.name, 'Top up ' + p.name,
          p.price - 1000, p.price, p.price, p.price, p.price, p.originalPrice, p.name, p.name
        ]).catch(e => {
            // Ignore conflict issues if sku conflicts
        });
      }
      console.log('Seeded products for ' + game.slug);
    }
  }

  await client.end();
}
run().catch(console.error);
