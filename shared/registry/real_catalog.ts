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
