import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:12345@localhost:5432/sassygurl",
});

async function run() {
  await client.connect();
  
  const allProductsResult = await client.query('SELECT COUNT(*) as total FROM "Products"');
  console.log(`Total Products: ${allProductsResult.rows[0].total}`);
  
  const ambiguousResult = await client.query(`
    SELECT "Id", "Sku", "Name", "IsActive", "Metadata" 
    FROM "Products" 
    WHERE "Metadata"->>'needsReview' = 'true'
  `);
  console.log(`Ambiguous Products (Needs Review): ${ambiguousResult.rowCount}`);
  console.log(ambiguousResult.rows.slice(0, 5));
  
  const incorrectGroupingResult = await client.query(`
    SELECT "Id", "Sku", "Name"
    FROM "Products"
    WHERE "Name" ILIKE '%pass%' AND "Metadata"->>'needsReview' != 'true' AND "Metadata"->>'itemCategory' = 'CURRENCY'
  `);
  console.log(`Passes Incorrectly Grouped as Currency: ${incorrectGroupingResult.rowCount}`);
  if (incorrectGroupingResult.rowCount > 0) {
      console.log(incorrectGroupingResult.rows);
  }

  const incorrectGroupingResult2 = await client.query(`
    SELECT "Id", "Sku", "Name", "Metadata"
    FROM "Products"
    WHERE "Name" ILIKE '%starlight%' AND "Metadata"->>'itemCategory' != 'PASS_MEMBERSHIP'
  `);
  console.log(`Starlight Incorrectly Grouped: ${incorrectGroupingResult2.rowCount}`);
  if (incorrectGroupingResult2.rowCount > 0) {
      console.log(incorrectGroupingResult2.rows);
  }

  const reviewQueue = await client.query(`
    SELECT "Id", "Sku", "Name", "ProviderId", "Metadata"
    FROM "Products"
    WHERE "Metadata"->>'needsReview' = 'true'
  `);
  console.log(`\nReview Queue Sample:`);
  console.log(reviewQueue.rows.slice(0, 5));

  await client.end();
}

run().catch(console.error);
