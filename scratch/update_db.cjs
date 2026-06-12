const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:12345@localhost:5432/sassygurl'
});

async function run() {
  await client.connect();
  const res = await client.query(`UPDATE "User" SET "Role" = 6 WHERE "Email" = 'admin@sassygurl.store'`);
  console.log(`Rows updated: ` + res.rowCount);
  await client.end();
}

run().catch(console.error);
