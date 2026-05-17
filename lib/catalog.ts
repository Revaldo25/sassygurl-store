export type ProductKind = "CURRENCY" | "PASS" | "BUNDLE" | "SKIN" | "SUBSCRIPTION" | "JOKI" | "MAGIC_CHESS" | "OTHER";

export type ProviderQuote = {
  digiflazz: number;
  vip: number;
};

export type Product = {
  sku: string;
  slug: string;
  name: string;
  kind: ProductKind;
  image: string;
  basePrice: number;
  amount?: number;
  bonusAmount?: number;
  label?: string;
  description?: string;
  providerQuotes: ProviderQuote;
  isPopular?: boolean;
  isBestValue?: boolean;
  isHot?: boolean;
};

export type Game = {
  slug: string;
  shortCode: string;
  name: string;
  subtitle: string;
  icon: string;
  banner: string;
  accent: string;
  description: string;
  isFeatured?: boolean;
  stats: {
    online: string;
    sold: string;
    rating: string;
  };
  products: Product[];
};

export type PaymentMethod = {
  code: string;
  name: string;
  type: "QRIS" | "EWALLET" | "VIRTUAL_ACCOUNT" | "RETAIL";
  feeFlat: number;
  feePercent: number;
  estimate: string;
  icon: string;
  highlight?: boolean;
};

// --------------------------------------------------------------------------------
// REAL DATA HELPERS
// --------------------------------------------------------------------------------

export function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function simulateUsername(gameSlug: string, id: string, zone?: string) {
  const clean = id.replace(/\D/g, "");
  if (clean.length < 5) return null; // Real-time check threshold

  const seed = clean.split("").reduce((acc, n) => acc + Number(n), 0) + (zone ? Number(zone.replace(/\D/g, "").slice(-2) || 0) : 0);
  const names = {
    mlbb: ["Miya", "Lancelot", "Gusion", "Novaria", "Alucard", "Kagura"],
    "genshin-impact": ["Aether", "Lumine", "Nahida", "Neuvillette", "Arlecchino", "Furina"],
    "honkai-star-rail": ["Trailblazer", "Kafka", "Acheron", "Firefly", "Dan Heng", "Ruan Mei"],
    "zenless-zone-zero": ["Wise", "Belle", "Anby", "Nicole", "Ellen", "Lycaon"],
    "wuthering-waves": ["Rover", "Jinhsi", "Changli", "Camellya", "Zhezhi", "Jiyan"],
    "arknights-endfield": ["Endfield", "Talos", "Perlica", "Frostline", "Morrison", "Arclight"],
  } as const;

  const pick = names[gameSlug as keyof typeof names] ?? ["Player", "Sultan", "Hunter", "Ace", "Nova", "Lux"];
  const first = pick[seed % pick.length];
  const suffix = String((seed * 37) % 9999).padStart(4, "0");
  return `${first}_${suffix}`;
}

// EMPTY EXPORTS TO PREVENT BREAKING IMPORTS
export const games: Game[] = [];
export const paymentMethods: PaymentMethod[] = [];
export const liveTransactions: any[] = [];
export const featuredGames: Game[] = [];
