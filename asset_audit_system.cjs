const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const registryPath = path.join(rootDir, 'shared', 'registry', 'games_registry.json');
const manifestPath = path.join(rootDir, 'shared', 'registry', 'games_manifest.json');
const publicImagesDir = path.join(rootDir, 'public', 'images');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Identify Tier 1 Games (arbitrarily defined as the most popular or isHot=true from DB, but we can check the registry)
// For SassyGurl, Tier 1 usually includes: MLBB, FF, PUBG, Genshin, HSR, ZZZ, Valorant, HOK, Roblox, AKEF.
const tier1Games = ['mlbb', 'ff', 'pubg', 'genshin', 'hsr', 'zzz', 'valorant', 'hok', 'roblox', 'arknights-endfield'];

const reports = {
  missingAssets: [],
  invalidPaths: [],
  duplicateUsage: new Map(),
  orphanAssets: [],
  tier1Coverage: [],
  suggestedCleanup: []
};

const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const allManifestPaths = new Set();
const fallbackImages = [
  '/images/hero/hero_topup_bundle_03.jpg',
  '/images/games/default_icon.png',
  '/images/hero/hero_anime_duo_action.webp',
  '/images/hero/hero_genshin_fantasy_battle.webp',
  '/images/hero/hero_sci_fi_team_banner.webp'
];

// 1. Walk through manifest to check usage, extensions, missing files
for (const [slug, assets] of Object.entries(manifest)) {
  for (const [key, imagePath] of Object.entries(assets)) {
    if (key === 'accent') continue;

    allManifestPaths.add(imagePath);

    const ext = path.extname(imagePath).toLowerCase();
    if (!validExtensions.includes(ext)) {
      reports.invalidPaths.push({ slug, key, path: imagePath, reason: `Invalid extension ${ext}` });
    }

    const fullPath = path.join(rootDir, 'public', imagePath.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
      reports.missingAssets.push({ slug, key, path: imagePath });
    }

    if (!reports.duplicateUsage.has(imagePath)) {
      reports.duplicateUsage.set(imagePath, []);
    }
    reports.duplicateUsage.get(imagePath).push(slug);
  }
}

// 2. Find Orphan Assets in public/images/hero and public/images/games
function getFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const allImageFiles = getFiles(path.join(publicImagesDir, 'hero')).concat(getFiles(path.join(publicImagesDir, 'games')));

allImageFiles.forEach(file => {
  const relativePath = '/' + path.relative(path.join(rootDir, 'public'), file).replace(/\\/g, '/');
  if (!allManifestPaths.has(relativePath)) {
    reports.orphanAssets.push(relativePath);
  }
});

// 3. Tier 1 Coverage
tier1Games.forEach(slug => {
  const assets = manifest[slug];
  if (!assets) {
    reports.tier1Coverage.push({ slug, status: 'NO_MANIFEST_ENTRY' });
    return;
  }
  
  const heroUsage = reports.duplicateUsage.get(assets.hero) || [];
  if (heroUsage.length > 1) {
    reports.tier1Coverage.push({ slug, status: 'SHARES_HERO_BANNER_WITH_OTHERS', sharedWith: heroUsage.filter(s => s !== slug) });
  } else if (fallbackImages.includes(assets.hero)) {
    reports.tier1Coverage.push({ slug, status: 'USES_FALLBACK_HERO_BANNER' });
  } else {
    reports.tier1Coverage.push({ slug, status: 'UNIQUE_HERO_BANNER_OK' });
  }
});

// Build report
console.log("=== 1. MISSING ASSET REPORT ===");
console.log(reports.missingAssets.length === 0 ? "No missing assets." : reports.missingAssets);

console.log("\n=== 2. INVALID PATH REPORT ===");
console.log(reports.invalidPaths.length === 0 ? "No invalid paths or extensions." : reports.invalidPaths);

console.log("\n=== 3. DUPLICATE USAGE REPORT ===");
let hasDuplicates = false;
for (const [imagePath, slugs] of reports.duplicateUsage.entries()) {
  if (slugs.length > 1) {
    hasDuplicates = true;
    console.log(`- ${imagePath} is shared by: ${slugs.join(', ')}`);
    if (fallbackImages.includes(imagePath)) {
      console.log(`  (WARNING: This is a fallback image being overused)`);
    }
  }
}
if (!hasDuplicates) console.log("No duplicate assets found.");

console.log("\n=== 4. ORPHAN ASSET REPORT ===");
console.log(reports.orphanAssets.length === 0 ? "No orphan assets." : reports.orphanAssets);

console.log("\n=== 5. TIER 1 COVERAGE REPORT ===");
console.log(reports.tier1Coverage);

console.log("\n=== 6. SUGGESTED CLEANUP ACTIONS ===");
if (reports.orphanAssets.length > 0) {
  console.log(`- Delete ${reports.orphanAssets.length} orphan images to save space.`);
}
const toGenerate = reports.tier1Coverage.filter(c => c.status !== 'UNIQUE_HERO_BANNER_OK').map(c => c.slug);
if (toGenerate.length > 0) {
  console.log(`- Generate unique premium banners for Tier 1 games: ${toGenerate.join(', ')}`);
}
