const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='ProductCategory'")
  .then(r => console.log(r.rows))
  .finally(() => pool.end());
