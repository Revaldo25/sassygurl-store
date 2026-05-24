const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:12345@localhost:5432/sassygurl' });
client.connect()
  .then(() => client.query('UPDATE "Game" SET "hasServerId" = true WHERE slug = \'zzz\';'))
  .then(res => { console.log(res.rowCount); return client.end(); })
  .catch(err => { console.error(err); process.exit(1); });
