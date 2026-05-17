const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });
client.connect()
.then(() => client.query('SELECT count(*) FROM "Game"'))
.then(res => { console.log('Game count:', res.rows[0].count); return client.query('SELECT count(*) FROM "Product"'); })
.then(res => { console.log('Product count:', res.rows[0].count); return client.query('SELECT "Name", "GameId" FROM "Product" LIMIT 5'); })
.then(res => { console.log('Sample Products:', res.rows); client.end(); })
.catch(err => { console.error('DB Error:', err); client.end(); });
