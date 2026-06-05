const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  const res = await client.query('SELECT slug, "isActive" FROM "Game" WHERE slug = \'wuwa\'');
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
