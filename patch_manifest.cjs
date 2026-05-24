const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'shared', 'registry', 'games_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const updatedManifest = { ...manifest };

// The games we successfully downloaded real banners for:
const downloaded = ['mlbb', 'ff', 'pubg', 'roblox', 'nikke', 'mccg', 'genshin', 'lol', 'steam', 'lolwr', 'hsr', 'wuwa', 'zzz', 'hok', 'bs', 'fcm', 'aether-gazer', 'arknights-endfield'];

for (const slug of downloaded) {
    if (updatedManifest[slug]) {
        updatedManifest[slug].hero = `/images/hero/hero_${slug}.jpg`;
    }
}

// Write the updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2), 'utf8');
console.log("Updated games_manifest.json with real official banner paths!");
