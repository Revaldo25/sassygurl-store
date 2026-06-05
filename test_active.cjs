const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  let res = await client.query('UPDATE "Game" SET "isActive" = true');
  console.log('Activated:', res.rowCount);
  res = await client.query('SELECT slug, "isActive" FROM "Game" WHERE slug = \'wuwa\'');
  console.log('Immediate check:', res.rows[0]);
  
  await new Promise(r => setTimeout(r, 5000));
  
  res = await client.query('SELECT slug, "isActive" FROM "Game" WHERE slug = \'wuwa\'');
  console.log('After 5s check:', res.rows[0]);

  await client.end();
}
run().catch(console.error);
