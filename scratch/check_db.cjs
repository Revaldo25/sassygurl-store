const { Client } = require('pg');

async function check() {
    const client = new Client({
        connectionString: "Host=localhost;Database=sassygurl;Username=postgres;Password=postgres"
    });
    await client.connect();
    
    const res = await client.query("SELECT email, password, \"isVerified\", role FROM \"User\" WHERE email = 'puppeteer@test.com'");
    console.log(res.rows);
    
    await client.end();
}
check();
