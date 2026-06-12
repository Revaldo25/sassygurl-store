const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:12345@localhost:5432/sassygurl'
});

client.connect()
  .then(() => client.query('UPDATE "Game" SET "isActive" = true'))
  .then(res => {
    console.log(`Updated ${res.rowCount} games to isActive = true`);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
