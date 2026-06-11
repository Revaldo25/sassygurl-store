export interface RealProduct {
  name: string;
  price: number;
  originalPrice: number;
  type: string;
}

export const REAL_CATALOG: Record<string, RealProduct[]> = {
  mlbb: [
    { name: "Weekly Diamond Pass", price: 28500, originalPrice: 30000, type: "PASS" },
    { name: "Twilight Pass", price: 135000, originalPrice: 150000, type: "PASS" },
    { name: "86 Diamonds", price: 24000, originalPrice: 26000, type: "CODE" },
    { name: "172 Diamonds", price: 47500, originalPrice: 50000, type: "CODE" },
    { name: "257 Diamonds", price: 68500, originalPrice: 75000, type: "CODE" },
    { name: "344 Diamonds", price: 92000, originalPrice: 100000, type: "CODE" },
    { name: "429 Diamonds", price: 114000, originalPrice: 125000, type: "CODE" },
    { name: "514 Diamonds", price: 136000, originalPrice: 150000, type: "CODE" },
    { name: "706 Diamonds", price: 184000, originalPrice: 200000, type: "CODE" },
    { name: "878 Diamonds", price: 228000, originalPrice: 250000, type: "CODE" },
    { name: "1050 Diamonds", price: 275000, originalPrice: 300000, type: "CODE" },
    { name: "2195 Diamonds", price: 545000, originalPrice: 600000, type: "CODE" },
    { name: "3688 Diamonds", price: 915000, originalPrice: 1000000, type: "CODE" },
    { name: "5532 Diamonds", price: 1365000, originalPrice: 1500000, type: "CODE" },
    { name: "9288 Diamonds", price: 2290000, originalPrice: 2500000, type: "CODE" },
  ],
  ff: [
    { name: "Membership Mingguan", price: 28000, originalPrice: 30000, type: "PASS" },
    { name: "Membership Bulanan", price: 85000, originalPrice: 90000, type: "PASS" },
    { name: "70 Diamonds", price: 9500, originalPrice: 10000, type: "CODE" },
    { name: "100 Diamonds", price: 14000, originalPrice: 15000, type: "CODE" },
    { name: "140 Diamonds", price: 19000, originalPrice: 20000, type: "CODE" },
    { name: "210 Diamonds", price: 28500, originalPrice: 30000, type: "CODE" },
    { name: "355 Diamonds", price: 47500, originalPrice: 50000, type: "CODE" },
    { name: "720 Diamonds", price: 95000, originalPrice: 100000, type: "CODE" },
    { name: "1450 Diamonds", price: 190000, originalPrice: 200000, type: "CODE" },
    { name: "2180 Diamonds", price: 285000, originalPrice: 300000, type: "CODE" },
    { name: "7290 Diamonds", price: 950000, originalPrice: 1000000, type: "CODE" },
  ],
  genshin: [
    { name: "Blessing of the Welkin Moon", price: 65000, originalPrice: 79000, type: "PASS" },
    { name: "60 Genesis Crystals", price: 14000, originalPrice: 16000, type: "CODE" },
    { name: "300+30 Genesis Crystals", price: 65000, originalPrice: 79000, type: "CODE" },
    { name: "980+110 Genesis Crystals", price: 215000, originalPrice: 249000, type: "CODE" },
    { name: "1980+260 Genesis Crystals", price: 430000, originalPrice: 479000, type: "CODE" },
    { name: "3280+600 Genesis Crystals", price: 715000, originalPrice: 799000, type: "CODE" },
    { name: "6480+1600 Genesis Crystals", price: 1435000, originalPrice: 1599000, type: "CODE" },
  ],
  hsr: [
    { name: "Express Supply Pass", price: 65000, originalPrice: 79000, type: "PASS" },
    { name: "60 Oneiric Shards", price: 14000, originalPrice: 16000, type: "CODE" },
    { name: "300+30 Oneiric Shards", price: 65000, originalPrice: 79000, type: "CODE" },
    { name: "980+110 Oneiric Shards", price: 215000, originalPrice: 249000, type: "CODE" },
    { name: "1980+260 Oneiric Shards", price: 430000, originalPrice: 479000, type: "CODE" },
    { name: "3280+600 Oneiric Shards", price: 715000, originalPrice: 799000, type: "CODE" },
    { name: "6480+1600 Oneiric Shards", price: 1435000, originalPrice: 1599000, type: "CODE" },
  ],
  zzz: [
    { name: "Inter-Knot Membership", price: 65000, originalPrice: 79000, type: "PASS" },
    { name: "60 Monochromes", price: 14000, originalPrice: 16000, type: "CODE" },
    { name: "300+30 Monochromes", price: 65000, originalPrice: 79000, type: "CODE" },
    { name: "980+110 Monochromes", price: 215000, originalPrice: 249000, type: "CODE" },
    { name: "1980+260 Monochromes", price: 430000, originalPrice: 479000, type: "CODE" },
    { name: "3280+600 Monochromes", price: 715000, originalPrice: 799000, type: "CODE" },
    { name: "6480+1600 Monochromes", price: 1435000, originalPrice: 1599000, type: "CODE" },
  ],
  pubg: [
    { name: "Royale Pass Elite", price: 145000, originalPrice: 150000, type: "PASS" },
    { name: "Royale Pass Elite Plus", price: 360000, originalPrice: 380000, type: "PASS" },
    { name: "60 UC", price: 14000, originalPrice: 15000, type: "CODE" },
    { name: "325 UC", price: 68000, originalPrice: 75000, type: "CODE" },
    { name: "660 UC", price: 135000, originalPrice: 150000, type: "CODE" },
    { name: "1800 UC", price: 340000, originalPrice: 375000, type: "CODE" },
    { name: "3850 UC", price: 680000, originalPrice: 750000, type: "CODE" },
    { name: "8100 UC", price: 1360000, originalPrice: 1500000, type: "CODE" },
  ],
  valorant: [
    { name: "125 Valorant Points", price: 14000, originalPrice: 15000, type: "CODE" },
    { name: "420 Valorant Points", price: 47000, originalPrice: 50000, type: "CODE" },
    { name: "700 Valorant Points", price: 75000, originalPrice: 80000, type: "CODE" },
    { name: "1375 Valorant Points", price: 142000, originalPrice: 150000, type: "CODE" },
    { name: "2400 Valorant Points", price: 238000, originalPrice: 250000, type: "CODE" },
    { name: "4000 Valorant Points", price: 380000, originalPrice: 400000, type: "CODE" },
    { name: "8150 Valorant Points", price: 760000, originalPrice: 800000, type: "CODE" },
  ]
};

// Auto-pad missing games with realistic generic data
export function getRealProductsForGame(slug: string, currencyName: string = "Item"): RealProduct[] {
  if (REAL_CATALOG[slug]) {
    return REAL_CATALOG[slug];
  }
  
  // Generic fallback with realistic looking values
  return [
    { name: `Small ${currencyName} Pack`, price: 15000, originalPrice: 20000, type: "CODE" },
    { name: `Basic ${currencyName} Pack`, price: 50000, originalPrice: 60000, type: "CODE" },
    { name: `Advanced ${currencyName} Pack`, price: 100000, originalPrice: 120000, type: "CODE" },
    { name: `Pro ${currencyName} Pack`, price: 250000, originalPrice: 300000, type: "CODE" },
    { name: `Elite ${currencyName} Pack`, price: 500000, originalPrice: 600000, type: "CODE" },
    { name: `Ultimate ${currencyName} Pack`, price: 1000000, originalPrice: 1200000, type: "CODE" },
  ];
}

// ── EXTENDED CATALOG (tambahan dari update Juni 2026) ──────────────────────

// Extend REAL_CATALOG dengan game yang belum ada
Object.assign(REAL_CATALOG, {

  hok: [
    { name: "Token 30",    price: 7500,    originalPrice: 9000,    type: "CODE" },
    { name: "Token 90",    price: 22000,   originalPrice: 25000,   type: "CODE" },
    { name: "Token 180",   price: 43000,   originalPrice: 50000,   type: "CODE" },
    { name: "Token 370",   price: 85000,   originalPrice: 100000,  type: "CODE" },
    { name: "Token 750",   price: 165000,  originalPrice: 200000,  type: "CODE" },
    { name: "Token 1500",  price: 320000,  originalPrice: 400000,  type: "CODE" },
    { name: "Brave Pass",  price: 75000,   originalPrice: 90000,   type: "PASS" },
  ],

  wuwa: [
    { name: "Lunite Subscription",      price: 65000,   originalPrice: 79000,   type: "PASS" },
    { name: "60 Lunites",               price: 14000,   originalPrice: 16000,   type: "CODE" },
    { name: "300+30 Lunites",           price: 65000,   originalPrice: 79000,   type: "CODE" },
    { name: "980+110 Lunites",          price: 215000,  originalPrice: 249000,  type: "CODE" },
    { name: "1980+260 Lunites",         price: 430000,  originalPrice: 479000,  type: "CODE" },
    { name: "3280+600 Lunites",         price: 715000,  originalPrice: 799000,  type: "CODE" },
    { name: "6480+1600 Lunites",        price: 1435000, originalPrice: 1599000, type: "CODE" },
  ],

  nikke: [
    { name: "60 Gems",    price: 14000,   originalPrice: 16000,  type: "CODE" },
    { name: "330 Gems",   price: 65000,   originalPrice: 79000,  type: "CODE" },
    { name: "1090 Gems",  price: 215000,  originalPrice: 249000, type: "CODE" },
    { name: "2240 Gems",  price: 430000,  originalPrice: 479000, type: "CODE" },
    { name: "3880 Gems",  price: 715000,  originalPrice: 799000, type: "CODE" },
    { name: "8080 Gems",  price: 1435000, originalPrice: 1599000, type: "CODE" },
  ],

  roblox: [
    { name: "400 Robux",   price: 57000,   originalPrice: 65000,   type: "CODE" },
    { name: "800 Robux",   price: 112000,  originalPrice: 130000,  type: "CODE" },
    { name: "1700 Robux",  price: 230000,  originalPrice: 270000,  type: "CODE" },
    { name: "2000 Robux",  price: 270000,  originalPrice: 310000,  type: "CODE" },
    { name: "4500 Robux",  price: 570000,  originalPrice: 650000,  type: "CODE" },
    { name: "10000 Robux", price: 1280000, originalPrice: 1450000, type: "CODE" },
  ],

  "steam-wallet": [
    { name: "Steam Wallet $5",   price: 78000,   originalPrice: 82000,   type: "CODE" },
    { name: "Steam Wallet $10",  price: 155000,  originalPrice: 163000,  type: "CODE" },
    { name: "Steam Wallet $20",  price: 308000,  originalPrice: 326000,  type: "CODE" },
    { name: "Steam Wallet $30",  price: 461000,  originalPrice: 489000,  type: "CODE" },
    { name: "Steam Wallet $50",  price: 768000,  originalPrice: 815000,  type: "CODE" },
    { name: "Steam Wallet $100", price: 1535000, originalPrice: 1630000, type: "CODE" },
  ],

  lol: [
    { name: "650 Riot Points",   price: 95000,   originalPrice: 105000,  type: "CODE" },
    { name: "1380 Riot Points",  price: 195000,  originalPrice: 215000,  type: "CODE" },
    { name: "2800 Riot Points",  price: 375000,  originalPrice: 415000,  type: "CODE" },
    { name: "5600 Riot Points",  price: 740000,  originalPrice: 815000,  type: "CODE" },
    { name: "11000 Riot Points", price: 1450000, originalPrice: 1600000, type: "CODE" },
  ],

  lolwr: [
    { name: "490 Wild Cores",   price: 73000,   originalPrice: 82000,   type: "CODE" },
    { name: "980 Wild Cores",   price: 145000,  originalPrice: 163000,  type: "CODE" },
    { name: "2000 Wild Cores",  price: 290000,  originalPrice: 326000,  type: "CODE" },
    { name: "4200 Wild Cores",  price: 580000,  originalPrice: 652000,  type: "CODE" },
    { name: "9000 Wild Cores",  price: 1165000, originalPrice: 1305000, type: "CODE" },
  ],

  mccg: [
    { name: "Weekly Diamond Pass",   price: 28500,  originalPrice: 30000,  type: "PASS" },
    { name: "86 Diamonds",          price: 24000,  originalPrice: 26000,  type: "CODE" },
    { name: "172 Diamonds",         price: 47500,  originalPrice: 50000,  type: "CODE" },
    { name: "344 Diamonds",         price: 92000,  originalPrice: 100000, type: "CODE" },
    { name: "706 Diamonds",         price: 184000, originalPrice: 200000, type: "CODE" },
  ],

  "fc-mobile": [
    { name: "100 FC Coins",    price: 14000,   originalPrice: 16000,  type: "CODE" },
    { name: "500 FC Coins",    price: 68000,   originalPrice: 79000,  type: "CODE" },
    { name: "1050 FC Coins",   price: 138000,  originalPrice: 163000, type: "CODE" },
    { name: "2100 FC Coins",   price: 270000,  originalPrice: 326000, type: "CODE" },
    { name: "4300 FC Coins",   price: 540000,  originalPrice: 652000, type: "CODE" },
    { name: "9900 FC Coins",   price: 1240000, originalPrice: 1500000, type: "CODE" },
  ],

  "arknights-endfield": [
    { name: "Blessing Capsule",          price: 65000,   originalPrice: 79000,   type: "PASS" },
    { name: "60 Original Ingots",        price: 14000,   originalPrice: 16000,   type: "CODE" },
    { name: "300+30 Original Ingots",    price: 65000,   originalPrice: 79000,   type: "CODE" },
    { name: "980+110 Original Ingots",   price: 215000,  originalPrice: 249000,  type: "CODE" },
    { name: "1980+260 Original Ingots",  price: 430000,  originalPrice: 479000,  type: "CODE" },
    { name: "3280+600 Original Ingots",  price: 715000,  originalPrice: 799000,  type: "CODE" },
    { name: "6480+1600 Original Ingots", price: 1435000, originalPrice: 1599000, type: "CODE" },
  ],

  "delta-force": [
    { name: "100 Coins",    price: 14000,   originalPrice: 16000,  type: "CODE" },
    { name: "500 Coins",    price: 68000,   originalPrice: 79000,  type: "CODE" },
    { name: "1000 Coins",   price: 135000,  originalPrice: 163000, type: "CODE" },
    { name: "2000 Coins",   price: 265000,  originalPrice: 326000, type: "CODE" },
    { name: "5000 Coins",   price: 655000,  originalPrice: 800000, type: "CODE" },
  ],

  "blood-strike": [
    { name: "60 Gems",     price: 14000,   originalPrice: 16000,   type: "CODE" },
    { name: "300 Gems",    price: 65000,   originalPrice: 79000,   type: "CODE" },
    { name: "980 Gems",    price: 195000,  originalPrice: 230000,  type: "CODE" },
    { name: "2000 Gems",   price: 390000,  originalPrice: 460000,  type: "CODE" },
    { name: "4200 Gems",   price: 780000,  originalPrice: 920000,  type: "CODE" },
  ],

  "aether-gazer": [
    { name: "Monthly Privilege",      price: 65000,  originalPrice: 79000,   type: "PASS" },
    { name: "60 Futurits",            price: 14000,  originalPrice: 16000,   type: "CODE" },
    { name: "330 Futurits",           price: 65000,  originalPrice: 79000,   type: "CODE" },
    { name: "680 Futurits",           price: 135000, originalPrice: 163000,  type: "CODE" },
    { name: "1390 Futurits",          price: 265000, originalPrice: 326000,  type: "CODE" },
    { name: "2800 Futurits",          price: 530000, originalPrice: 652000,  type: "CODE" },
    { name: "5700 Futurits",          price: 1050000, originalPrice: 1305000, type: "CODE" },
  ],

  pubgm: [
    { name: "60 NC",     price: 14000,   originalPrice: 16000,  type: "CODE" },
    { name: "325 NC",    price: 65000,   originalPrice: 79000,  type: "CODE" },
    { name: "660 NC",    price: 130000,  originalPrice: 163000, type: "CODE" },
    { name: "1800 NC",   price: 340000,  originalPrice: 400000, type: "CODE" },
  ],
});
