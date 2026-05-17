const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/sassygurl' });
client.connect().then(() => client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Products';"))
.then(res => { console.log(res.rows); client.end(); });
