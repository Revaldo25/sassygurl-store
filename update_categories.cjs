const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  
  const res = await client.query(`
    UPDATE "Product" 
    SET metadata = 
      CASE 
        WHEN name ILIKE '%Pass%' OR name ILIKE '%Membership%' OR name ILIKE '%Subscription%' 
        THEN '{"itemCategory": "PASS_MEMBERSHIP", "itemCategoryLabel": "Pass & Membership", "itemCategoryIcon": "🎫", "isManuallyMapped": true}'::jsonb
        ELSE '{"itemCategory": "CURRENCY", "itemCategoryLabel": "Premium Currency", "itemCategoryIcon": "💎", "isManuallyMapped": true}'::jsonb
      END
  `);
  
  console.log("Products metadata updated with isManuallyMapped: true. Count: " + res.rowCount);
  await client.end();
}
run().catch(console.error);
