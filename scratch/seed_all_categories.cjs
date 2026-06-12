const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl'
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Clear existing categories and detach from products
    console.log('Clearing existing categories...');
    await client.query('UPDATE "Product" SET "productCategoryId" = NULL');
    await client.query('DELETE FROM "ProductCategory"');

    // 2. Get all games
    const { rows: games } = await client.query('SELECT "id", "slug" FROM "Game"');
    console.log(`Found ${games.length} games. Processing...`);

    for (const game of games) {
      console.log(`\n--- Seeding categories for game: ${game.slug} ---`);
      
      // Default mappings
      let categoriesToCreate = [];
      
      if (game.slug === 'mlbb') {
        categoriesToCreate = [
          { name: 'Weekly Pass', icon: '🎫', sortOrder: 0, matchKeywords: ['weekly', 'twilight'] },
          { name: 'Starlight', icon: '⭐', sortOrder: 1, matchKeywords: ['starlight', 'member'] },
          { name: 'Diamonds', icon: '💎', sortOrder: 99, matchKeywords: ['diamond', 'dm'] }
        ];
      } else if (game.slug === 'ff') {
        categoriesToCreate = [
          { name: 'Membership', icon: '👑', sortOrder: 0, matchKeywords: ['member', 'mingguan', 'bulanan'] },
          { name: 'Diamonds', icon: '💎', sortOrder: 99, matchKeywords: ['diamond', 'dm'] }
        ];
      } else if (game.slug === 'pubgm' || game.slug === 'pubg') {
        categoriesToCreate = [
          { name: 'Royale Pass', icon: '🏆', sortOrder: 0, matchKeywords: ['pass', 'rp'] },
          { name: 'UC', icon: '💵', sortOrder: 99, matchKeywords: ['uc'] }
        ];
      } else if (game.slug === 'genshin' || game.slug === 'hsr' || game.slug === 'zzz' || game.slug === 'wuwa') {
        categoriesToCreate = [
          { name: 'Supply Pass', icon: '🎫', sortOrder: 0, matchKeywords: ['blessing', 'pass', 'express', 'monthly'] },
          { name: 'Crystals', icon: '✨', sortOrder: 99, matchKeywords: ['crystal', 'onecs', 'jade', 'lunite'] }
        ];
      } else if (game.slug === 'roblox') {
        categoriesToCreate = [
          { name: 'Robux', icon: '🪙', sortOrder: 0, matchKeywords: ['robux'] },
          { name: 'Premium', icon: '👑', sortOrder: 1, matchKeywords: ['premium'] }
        ];
      } else if (game.slug === 'valorant') {
        categoriesToCreate = [
          { name: 'Valorant Points', icon: '🔴', sortOrder: 0, matchKeywords: ['point', 'vp'] },
          { name: 'Radianite', icon: '🟡', sortOrder: 1, matchKeywords: ['radianite'] }
        ];
      } else {
        categoriesToCreate = [
          { name: 'Top Up', icon: '💰', sortOrder: 0, matchKeywords: [''] }
        ];
      }

      const createdCategoryIds = [];

      for (const cat of categoriesToCreate) {
        // Insert Category
        const catId = require('crypto').randomUUID();
        await client.query(
          'INSERT INTO "ProductCategory" ("id", "gameId", "name", "icon", "sortOrder") VALUES ($1, $2, $3, $4, $5)',
          [catId, game.id, cat.name, cat.icon, cat.sortOrder]
        );
        cat.id = catId;
        console.log(`Created category [${cat.name}] Priority: ${cat.sortOrder === 0 ? 'YES' : 'NO'}`);
      }

      // Assign Products
      const { rows: products } = await client.query('SELECT "id", "name" FROM "Product" WHERE "gameId" = $1', [game.id]);
      
      for (const product of products) {
        let assignedCatId = null;
        
        // Find matching category
        const pName = product.name.toLowerCase();
        
        for (const cat of categoriesToCreate) {
          if (cat.matchKeywords.some(kw => kw && pName.includes(kw))) {
            assignedCatId = cat.id;
            break;
          }
        }
        
        // Fallback to the last category (usually the general currency one)
        if (!assignedCatId && categoriesToCreate.length > 0) {
          assignedCatId = categoriesToCreate[categoriesToCreate.length - 1].id;
        }

        if (assignedCatId) {
          await client.query('UPDATE "Product" SET "productCategoryId" = $1 WHERE "id" = $2', [assignedCatId, product.id]);
        }
      }
      
      console.log(`Assigned ${products.length} products to their respective categories.`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Successfully seeded all categories and assigned products for 21 games!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', e);
  } finally {
    client.release();
    pool.end();
  }
}

main();
