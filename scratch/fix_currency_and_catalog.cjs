const fs = require('fs');

// 1. Fix api-adapter.ts currency names
let apiAdapter = fs.readFileSync('lib/api-adapter.ts', 'utf8');

const currencyMap = {
  mlbb: "Diamonds",
  ff: "Diamonds",
  pubg: "UC",
  genshin: "Genesis Crystals",
  hsr: "Oneiric Shards",
  zzz: "Monochromes",
  "arknights-endfield": "Origeometry",
  hok: "Tokens",
  valorant: "Valorant Points",
  roblox: "Robux",
  "steam-wallet": "Wallet",
  "fc-mobile": "FC Points",
  "delta-force": "Coins",
  "blood-strike": "Gold",
  wuwa: "Lunites",
  nikke: "Gems",
  lol: "Riot Points",
  lolwr: "Wild Cores",
  mccg: "Pass & Items",
  "aether-gazer": "Shifted Stars"
};

// We will inject a helper function and use it for currencyName
const helperStr = `
const CURRENCY_MAP: Record<string, string> = {
  mlbb: "Diamonds",
  ff: "Diamonds",
  pubg: "UC",
  genshin: "Genesis Crystals",
  hsr: "Oneiric Shards",
  zzz: "Monochromes",
  "arknights-endfield": "Origeometry",
  hok: "Tokens",
  valorant: "Valorant Points",
  roblox: "Robux",
  "steam-wallet": "Wallet",
  "fc-mobile": "FC Points",
  "delta-force": "Coins",
  "blood-strike": "Gold",
  wuwa: "Lunites",
  nikke: "Gems",
  lol: "Riot Points",
  lolwr: "Wild Cores",
  mccg: "Pass & Items",
  "aether-gazer": "Shifted Stars"
};
`;

if (!apiAdapter.includes('CURRENCY_MAP')) {
  apiAdapter = apiAdapter.replace('export async function getAllGamesNormalized()', helperStr + '\\nexport async function getAllGamesNormalized()');
}

// Replace in both places where currencyName is set
apiAdapter = apiAdapter.replace(/currencyName:\s*g\.currencyName\s*\?\?\s*"Item"/, 'currencyName: CURRENCY_MAP[canonicalSlug] || g.currencyName || "Item"');
apiAdapter = apiAdapter.replace(/currencyName:\s*r\.currency_name\s*\?\?\s*"Item"/, 'currencyName: CURRENCY_MAP[slug] || "Item"');
apiAdapter = apiAdapter.replace(/currencyName:\s*"Item"/, 'currencyName: CURRENCY_MAP[slug] || "Item"');

fs.writeFileSync('lib/api-adapter.ts', apiAdapter);

// 2. Fix GameCatalogClient.tsx (Anime layout)
let catalog = fs.readFileSync('components/GameCatalogClient.tsx', 'utf8');

// Restore grid cols
catalog = catalog.replace(
  'className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in-up"',
  'className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-fade-in-up"'
);

// Restore aspect ratio and use icon
const oldImageContainerRegex = /\{\/\* Image Container \(Banner 16:9\) \*\/\}\s*<div className="relative aspect-\[16\/9\] w-full overflow-hidden bg-obsidian">\s*<Image\s*src=\{game\.banner \|\| game\.coverImage \|\| "\/images\/fallbacks\/game-default\.webp"\}\s*alt=\{game\.name\}\s*fill\s*sizes="\(max-width: 640px\) 100vw, \(max-width: 768px\) 50vw, 33vw"\s*className="object-cover transition-transform duration-700 group-hover:scale-110"\s*\/>/;

const newImageContainer = `{/* Image Container (Anime Portrait 3:4) */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-obsidian">
              <Image
                src={game.icon || game.coverImage || "/images/fallbacks/game-default-icon.svg"}
                alt={game.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />`;

catalog = catalog.replace(oldImageContainerRegex, newImageContainer);

// Also remove `currencyName || "Top Up VIP"` fallback to just `currencyName` since we have real data now
catalog = catalog.replace(/\{game\.currencyName \|\| "Top Up VIP"\}/, '{game.currencyName}');

fs.writeFileSync('components/GameCatalogClient.tsx', catalog);
console.log('Fixed API adapter currency and restored anime catalog layout');
