const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  
  console.log("--- GAME COLUMNS ---");
  const gameCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Game'
  `);
  console.log(gameCols.rows);

  console.log("--- PRODUCT COLUMNS ---");
  const prodCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Product'
  `);
  console.log(prodCols.rows);

  await client.end();
}

run().catch(console.error);
