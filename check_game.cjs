const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

async function run() {
  await client.connect();
  const res = await client.query('UPDATE "Game" SET "isActive" = true');
  console.log('Activated:', res.rowCount);
  await client.end();
}
run().catch(console.error);
