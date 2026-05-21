const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, name, slug, "isActive", "isHot", "sortOrder" FROM "Game" ORDER BY "sortOrder"');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
