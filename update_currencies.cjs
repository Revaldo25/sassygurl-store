const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:12345@localhost:5432/sassygurl' });

const currencies = {
  'mlbb': 'Diamonds',
  'ff': 'Diamonds',
  'genshin': 'Genesis Crystals',
  'hsr': 'Oneiric Shards',
  'zzz': 'Monochromes',
  'wuwa': 'Astrite',
  'pubg': 'UC',
  'valorant': 'Points',
  'hok': 'Tokens',
  'nikke': 'Gems',
  'lol': 'Points',
  'lolwr': 'Wild Cores',
  'roblox': 'Robux',
  'aether-gazer': 'Shifted Stars',
  'mccg': 'Coins',
  'arknights-endfield': 'Origeometry',
  'steam-wallet': 'Wallet IDR',
  'fc-mobile': 'Points',
  'delta-force': 'Coins',
  'blood-strike': 'Gold'
};

async function run() {
  await client.connect();
  console.log("Updating game currencies in DB...");
  for (const [slug, currency] of Object.entries(currencies)) {
    const res = await client.query('UPDATE "Game" SET "currencyName" = $1 WHERE slug = $2', [currency, slug]);
    console.log(`Updated ${slug} -> ${currency}: ${res.rowCount} rows`);
  }
  await client.end();
  console.log("Done.");
}

run().catch(console.error);
