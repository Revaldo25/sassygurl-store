const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });
client.connect()
  .then(() => client.query('SELECT id, name, slug, "isActive", "isHot" FROM "Game" ORDER BY "sortOrder"'))
  .then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    return client.end();
  })
  .catch(err => {
    console.error(err);
    client.end();
  });
