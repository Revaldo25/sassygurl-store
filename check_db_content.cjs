const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });
client.connect().then(() => client.query('SELECT count(*) FROM "Games"'))
.then(res => { console.log('Games count:', res.rows[0].count); return client.query('SELECT count(*) FROM "Products"'); })
.then(res => { console.log('Products count:', res.rows[0].count); return client.query('SELECT * FROM "Products" LIMIT 5'); })
.then(res => { console.log('Sample Products:', res.rows); client.end(); })
.catch(err => { console.error('DB Error:', err); client.end(); });
