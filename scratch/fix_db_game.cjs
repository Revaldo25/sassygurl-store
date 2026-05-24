const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:12345@localhost:5432/sassygurl' });
client.connect()
  .then(() => client.query('UPDATE "Game" SET "hasServerId" = false WHERE slug NOT IN (\'mobile-legends\', \'genshin\', \'hsr\', \'mlbb\', \'ml\');'))
  .then(res => { console.log(res.rowCount); return client.end(); })
  .catch(err => { 
    client.query('UPDATE "Game" SET "HasServerId" = false WHERE slug NOT IN (\'mobile-legends\', \'genshin\', \'hsr\', \'mlbb\', \'ml\');')
    .then(r => { console.log(r.rowCount); client.end(); })
    .catch(e => { console.error(e); process.exit(1); }) 
  });
