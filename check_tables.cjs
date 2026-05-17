const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });
client.connect().then(() => client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
.then(res => { console.log('Tables:', res.rows.map(r => r.table_name)); client.end(); })
.catch(err => { console.error('DB Error:', err); client.end(); });
