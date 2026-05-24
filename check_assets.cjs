const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'shared', 'registry', 'games_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const publicDir = path.join(__dirname, 'public');

const errors = [];
const missing = [];
const duplicates = new Map();
const fallbackImages = ['/images/hero/hero_topup_bundle_03.jpg', '/images/games/default_icon.png', '/images/hero/hero_anime_duo_action.webp', '/images/hero/hero_genshin_fantasy_battle.webp', '/images/hero/hero_sci_fi_team_banner.webp'];

for (const [slug, assets] of Object.entries(manifest)) {
  for (const [key, imagePath] of Object.entries(assets)) {
    if (key === 'accent') continue;
    
    // Check missing
    const fullPath = path.join(publicDir, imagePath.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
      missing.push({ slug, key, path: imagePath });
    }
    
    // Check duplicates
    if (!duplicates.has(imagePath)) {
      duplicates.set(imagePath, []);
    }
    duplicates.get(imagePath).push(slug);
  }
}

console.log("Missing Assets:");
console.log(missing);

console.log("\nAssets used by multiple games (potential duplicates/fallbacks):");
for (const [imagePath, slugs] of duplicates.entries()) {
  if (slugs.length > 1) {
    console.log(`${imagePath} -> used by: ${slugs.join(', ')}`);
  }
}
