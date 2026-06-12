const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/sassygurl_db'
});
async function test() {
  const res = await pool.query("SELECT email, \"Role\" FROM \"Users\"");
  console.table(res.rows);
  pool.end();
}
test();
