const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

const AKEF_GAME_ID = 'b0798322-6d78-4ea2-b8f9-b4dbe0e7aa1a';

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB.");

    // Get category id for games
    const catResult = await client.query('SELECT id FROM "Category" WHERE slug = \'game\' LIMIT 1');
    const categoryId = catResult.rows[0]?.id || 'game-category-id-fallback';

    // Get a valid provider id
    const provResult = await client.query('SELECT id FROM "Provider" LIMIT 1');
    const providerId = provResult.rows[0]?.id;
    if (!providerId) {
      throw new Error("No provider found in 'Provider' table. Cannot seed products due to NOT-NULL constraint.");
    }
    console.log("Using Provider ID:", providerId);

    // 1. Fix Aether Gazer mapping (make sure name, slug, thumbnail, and banner are correct)
    console.log("Checking Aether Gazer in DB...");
    const agCheck = await client.query('SELECT id FROM "Game" WHERE slug = $1', ['aether-gazer']);
    if (agCheck.rows.length > 0) {
      console.log("Updating Aether Gazer details...");
      await client.query(`
        UPDATE "Game" 
        SET name = 'Aether Gazer', 
            thumbnail = '/images/games/akef_icon.jpeg', 
            banner = '/images/hero/hero_genshin_fantasy_battle.webp'
        WHERE slug = 'aether-gazer'
      `);
    } else {
      console.log("Aether Gazer not found, creating it...");
      await client.query(`
        INSERT INTO "Game" (id, "categoryId", name, slug, thumbnail, banner, "hasServerId", "isActive", "isHot", "sortOrder", "currencyName")
        VALUES ($1, $2, 'Aether Gazer', 'aether-gazer', '/images/games/akef_icon.jpeg', '/images/hero/hero_genshin_fantasy_battle.webp', false, true, false, 14, 'Item')
      `, [require('crypto').randomUUID(), categoryId]);
    }

    // 2. Insert Arknights: Endfield
    console.log("Checking Arknights: Endfield in DB...");
    const endfieldCheck = await client.query('SELECT id FROM "Game" WHERE slug = $1', ['arknights-endfield']);
    if (endfieldCheck.rows.length === 0) {
      console.log("Inserting Arknights: Endfield...");
      await client.query(`
        INSERT INTO "Game" (id, "categoryId", name, slug, thumbnail, banner, "hasServerId", "isActive", "isHot", "sortOrder", "currencyName")
        VALUES ($1, $2, 'Arknights: Endfield', 'arknights-endfield', '/images/games/akef_icon.jpeg', '/images/hero/hero_genshin_fantasy_battle.webp', false, true, true, 16, 'Item')
      `, [AKEF_GAME_ID, categoryId]);

      // Seed mock products for Arknights Endfield
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
          AKEF_GAME_ID,
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
      console.log("Arknights: Endfield game and products seeded successfully.");
    } else {
      console.log("Arknights: Endfield already exists in DB.");
    }

    // 3. Make sure Tier 2 games are seeded
    const tier2Games = [
      {
        slug: 'steam-wallet',
        name: 'Steam Wallet',
        thumbnail: '/images/games/rbx_icon.png',
        banner: '/images/hero/hero_topup_bundle_03.jpg',
        sort: 17,
        products: [
          { sku: "STEAM-50", name: "Steam Wallet Rp 50.000", price: 52000, originalPrice: 55000 },
          { sku: "STEAM-100", name: "Steam Wallet Rp 100.000", price: 104000, originalPrice: 110000 }
        ]
      },
      {
        slug: 'fc-mobile',
        name: 'FC Mobile',
        thumbnail: '/images/games/hok_icon.jpeg',
        banner: '/images/hero/hero_topup_bundle_03.jpg',
        sort: 18,
        products: [
          { sku: "FC-100", name: "100 FC Points", price: 15000, originalPrice: 17000 },
          { sku: "FC-500", name: "500 FC Points", price: 75000, originalPrice: 80000 }
        ]
      },
      {
        slug: 'delta-force',
        name: 'Delta Force',
        thumbnail: '/images/games/valorant_icon.jpeg',
        banner: '/images/hero/hero_sci_fi_team_banner.webp',
        sort: 19,
        products: [
          { sku: "DF-60", name: "60 Delta Coins", price: 14000, originalPrice: 16000 },
          { sku: "DF-300", name: "300 Delta Coins", price: 70000, originalPrice: 78000 }
        ]
      },
      {
        slug: 'blood-strike',
        name: 'Blood Strike',
        thumbnail: '/images/games/valorant_icon.jpeg',
        banner: '/images/hero/hero_topup_bundle_03.jpg',
        sort: 20,
        products: [
          { sku: "BS-100", name: "100 Gold", price: 16000, originalPrice: 18000 },
          { sku: "BS-500", name: "500 Gold", price: 78000, originalPrice: 85000 }
        ]
      }
    ];

    for (const g of tier2Games) {
      console.log(`Checking ${g.name} in DB...`);
      const gameCheck = await client.query('SELECT id FROM "Game" WHERE slug = $1', [g.slug]);
      let gameId;
      if (gameCheck.rows.length === 0) {
        console.log(`Inserting ${g.name}...`);
        gameId = require('crypto').randomUUID();
        await client.query(`
          INSERT INTO "Game" (id, "categoryId", name, slug, thumbnail, banner, "hasServerId", "isActive", "isHot", "sortOrder", "currencyName")
          VALUES ($1, $2, $3, $4, $5, $6, false, true, false, $7, 'Item')
        `, [gameId, categoryId, g.name, g.slug, g.thumbnail, g.banner, g.sort]);

        for (const p of g.products) {
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
            gameId,
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
        console.log(`${g.name} and products seeded successfully.`);
      } else {
        console.log(`${g.name} already exists in DB.`);
      }
    }

    console.log("DB Corrections completed successfully.");
  } catch (error) {
    console.error("Error executing DB Corrections:", error);
  } finally {
    await client.end();
  }
}

run();
