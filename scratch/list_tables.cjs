const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:12345@localhost:5432/sassygurl' });
client.connect()
  .then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
  .then(res => { console.log(res.rows.map(r => r.table_name)); return client.end(); })
  .catch(err => { console.error(err); process.exit(1); });
