const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../shared/registry/games_manifest.json');
const imagesDir = path.join(__dirname, '../public/images/games');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const filesInDir = fs.readdirSync(imagesDir);

let missingAssets = [];
let duplicateUsage = {};
let invalidExtensions = [];
let fallbackOveruse = 0;
let tier1Coverage = [];

const fallbackAssets = [
  '/images/games/default-icon.webp',
  '/images/games/default-banner.webp',
  '/images/games/placeholder.webp'
];

// 1. Scan Manifest
Object.keys(manifest).forEach(slug => {
  const game = manifest[slug];
  const assets = [game.logo, game.hero, game.thumbnail];
  
  assets.forEach(assetPath => {
    if (!assetPath) return;

    // Check extension
    if (!assetPath.endsWith('.webp') && !assetPath.endsWith('.png') && !assetPath.endsWith('.jpg')) {
      invalidExtensions.push({ slug, path: assetPath });
    }

    // Check fallback overuse
    if (fallbackAssets.includes(assetPath)) {
      fallbackOveruse++;
    }

    // Check missing file
    const localPath = path.join(__dirname, '..', 'public', assetPath.replace('/images/games/', 'images/games/'));
    if (!fs.existsSync(localPath)) {
      missingAssets.push({ slug, path: assetPath });
    }

    // Check duplicates
    if (!duplicateUsage[assetPath]) duplicateUsage[assetPath] = [];
    if (!duplicateUsage[assetPath].includes(slug)) {
      duplicateUsage[assetPath].push(slug);
    }
  });
});

// 2. Orphan Assets (Files in dir not in manifest)
const usedAssets = new Set();
Object.values(manifest).forEach(g => {
  if (g.logo) usedAssets.add(g.logo.split('/').pop());
  if (g.thumbnail) usedAssets.add(g.thumbnail.split('/').pop());
});

let orphanAssets = filesInDir.filter(f => !usedAssets.has(f) && f.match(/\.(png|jpg|webp)$/i));

// Filter duplicates (used by >1 game and not a fallback)
const duplicates = Object.entries(duplicateUsage).filter(([asset, slugs]) => slugs.length > 1 && !fallbackAssets.includes(asset));

console.log("=== ASSET INTEGRITY REPORT ===\n");

console.log(`1. MISSING ASSETS (${missingAssets.length}):`);
missingAssets.forEach(m => console.log(`   - [${m.slug}] ${m.path}`));

console.log(`\n2. INVALID EXTENSIONS (${invalidExtensions.length}):`);
invalidExtensions.forEach(m => console.log(`   - [${m.slug}] ${m.path}`));

console.log(`\n3. DUPLICATE USAGE (${duplicates.length} assets used by multiple games):`);
duplicates.forEach(([asset, slugs]) => console.log(`   - ${asset} -> Used by: ${slugs.join(', ')}`));

console.log(`\n4. ORPHAN ASSETS (${orphanAssets.length} files in folder but not in manifest):`);
if (orphanAssets.length < 20) {
  orphanAssets.forEach(o => console.log(`   - ${o}`));
} else {
  console.log(`   - (Too many to list, ${orphanAssets.length} items)`);
}

console.log(`\n5. FALLBACK OVERUSE:`);
console.log(`   - Default assets are used ${fallbackOveruse} times across the manifest.`);

console.log("\nTier 1 Coverage (Games that share visuals or use fallbacks):");
const tier1Slugs = ['mlbb', 'pubg', 'ff', 'genshin', 'valorant', 'hsr'];
tier1Slugs.forEach(slug => {
  const g = manifest[slug];
  if (!g) return;
  const isUniqueIcon = duplicateUsage[g.thumbnail]?.length === 1 && !fallbackAssets.includes(g.thumbnail);
  const isUniqueBanner = duplicateUsage[g.hero]?.length === 1 && !fallbackAssets.includes(g.hero);
  console.log(`   - [${slug}] Icon: ${isUniqueIcon ? 'UNIQUE' : 'DUPLICATE/FALLBACK'}, Banner: ${isUniqueBanner ? 'UNIQUE' : 'DUPLICATE/FALLBACK'}`);
});
