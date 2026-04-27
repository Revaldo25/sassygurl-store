export type ProductKind = "CURRENCY" | "PASS" | "BUNDLE" | "SKIN" | "SUBSCRIPTION" | "JOKI" | "OTHER";

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

function quoteProviders(basePrice: number) {
  const digiflazz = Math.round(basePrice * 1.07 + 150);
  const vip = Math.round(basePrice * 1.02 + 550);
  return { digiflazz, vip };
}

function currencyProduct(params: {
  sku: string;
  slug: string;
  name: string;
  amount: number;
  basePrice: number;
  image: string;
  bonusAmount?: number;
  label?: string;
  description?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  isHot?: boolean;
  kind?: ProductKind;
}): Product {
  return {
    ...params,
    kind: params.kind ?? "CURRENCY",
    providerQuotes: quoteProviders(params.basePrice),
  };
}

function passProduct(params: {
  sku: string;
  slug: string;
  name: string;
  basePrice: number;
  image: string;
  label?: string;
  description?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  isHot?: boolean;
  kind?: ProductKind;
}): Product {
  return {
    amount: undefined,
    bonusAmount: undefined,
    ...params,
    kind: params.kind ?? "PASS",
    providerQuotes: quoteProviders(params.basePrice),
  };
}

function bundleProduct(params: {
  sku: string;
  slug: string;
  name: string;
  basePrice: number;
  image: string;
  label?: string;
  description?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  isHot?: boolean;
  kind?: ProductKind;
}): Product {
  return {
    amount: undefined,
    bonusAmount: undefined,
    ...params,
    kind: params.kind ?? "BUNDLE",
    providerQuotes: quoteProviders(params.basePrice),
  };
}

export const paymentMethods: PaymentMethod[] = [
  {
    code: "qris",
    name: "QRIS",
    type: "QRIS",
    feeFlat: 0,
    feePercent: 0,
    estimate: "Instant • 1 Menit",
    icon: "/images/ui/payment-qris.svg",
    highlight: true,
  },
  {
    code: "dana",
    name: "DANA",
    type: "EWALLET",
    feeFlat: 1000,
    feePercent: 0,
    estimate: "Cepat • 1-3 Menit",
    icon: "/images/ui/payment-dana.svg",
  },
  {
    code: "gopay",
    name: "GoPay",
    type: "EWALLET",
    feeFlat: 1000,
    feePercent: 0,
    estimate: "Cepat • 1-3 Menit",
    icon: "/images/ui/payment-gopay.svg",
  },
  {
    code: "bca_va",
    name: "BCA Virtual Account",
    type: "VIRTUAL_ACCOUNT",
    feeFlat: 4500,
    feePercent: 0,
    estimate: "Auto • 1-5 Menit",
    icon: "/images/ui/payment-bca.svg",
  },
  {
    code: "mandiri_va",
    name: "Mandiri Virtual Account",
    type: "VIRTUAL_ACCOUNT",
    feeFlat: 4500,
    feePercent: 0,
    estimate: "Auto • 1-5 Menit",
    icon: "/images/ui/payment-mandiri.svg",
  },
  {
    code: "alfamart",
    name: "Alfamart",
    type: "RETAIL",
    feeFlat: 5000,
    feePercent: 0,
    estimate: "Manual • 5-15 Menit",
    icon: "/images/ui/payment-retail.svg",
  },
];

export const games: Game[] = [
  {
    slug: "mlbb",
    shortCode: "MLBB",
    name: "Mobile Legends: Bang Bang",
    subtitle: "Diamond, Weekly Pass, Starlight, Twilight Pass",
    icon: "/images/games/mlbb_icon.jpeg",
    banner: "/images/hero/hero_anime_duo_action.webp",
    accent: "#FDB0C0",
    description: "Top-up paling lengkap untuk MLBB dengan rasa premium, cepat, dan elegan.",
    isFeatured: true,
    stats: { online: "12.4K", sold: "106K", rating: "4.98" },
    products: [
      currencyProduct({ sku: "MLBB-D-3", slug: "mlbb-diamond-3", name: "3 Diamonds", amount: 3, basePrice: 1200, image: "/images/items/mlbb/diamond/diamond_3.png", label: "Entry", isHot: true }),
      currencyProduct({ sku: "MLBB-D-59", slug: "mlbb-diamond-59", name: "59 Diamonds", amount: 59, basePrice: 15000, image: "/images/items/mlbb/diamond/diamond_59.png", label: "Fast Pick" }),
      currencyProduct({ sku: "MLBB-D-170", slug: "mlbb-diamond-170", name: "170 Diamonds", amount: 170, basePrice: 42000, image: "/images/items/mlbb/diamond/diamond_170.png", label: "Best Value", isBestValue: true }),
      currencyProduct({ sku: "MLBB-D-568", slug: "mlbb-diamond-568", name: "568 Diamonds", amount: 568, basePrice: 139000, image: "/images/items/mlbb/diamond/diamond_568.png", label: "Popular", isPopular: true }),
      currencyProduct({ sku: "MLBB-D-2010", slug: "mlbb-diamond-2010", name: "2010 Diamonds", amount: 2010, basePrice: 472000, image: "/images/items/mlbb/diamond/diamond_2010.png", label: "Sultan Pack" }),
      currencyProduct({ sku: "MLBB-D-4830", slug: "mlbb-diamond-4830", name: "4830 Diamonds", amount: 4830, basePrice: 1129000, image: "/images/items/mlbb/diamond/diamond_4830.png", label: "Mega Pack", isHot: true }),
      passProduct({ sku: "MLBB-WDP", slug: "weekly-diamond-pass", name: "Weekly Diamond Pass", basePrice: 29000, image: "/images/items/mlbb/pass/weekly_diamond_pass.jpeg", label: "Daily Value", description: "Claim harian + bonus login." }),
      passProduct({ sku: "MLBB-STL", slug: "starlight-member", name: "Starlight Member", basePrice: 44900, image: "/images/items/mlbb/pass/starlight_card.jpeg", label: "Skin Route" }),
      passProduct({ sku: "MLBB-TWT", slug: "twilight-pass", name: "Twilight Pass", basePrice: 129000, image: "/images/items/mlbb/pass/twilight_pass.jpeg", label: "Premium Pass", isPopular: true }),
    ],
  },
  {
    slug: "genshin-impact",
    shortCode: "GI",
    name: "Genshin Impact",
    subtitle: "Chronal Nexus, Genesis Crystal, Welkin Moon",
    icon: "/images/games/gi_icon.jpeg",
    banner: "/images/hero/hero_genshin_fantasy_battle.webp",
    accent: "#7C3AED",
    description: "Kategori Genshin yang lebih rapih: crystal, bundle, dan blessing dipisah jelas.",
    stats: { online: "9.1K", sold: "58K", rating: "4.97" },
    products: [
      currencyProduct({ sku: "GI-CN-60", slug: "gi-chronal-nexus-60", name: "60 Chronal Nexus", amount: 60, basePrice: 15900, image: "/images/items/gi/chronal_nexus/chronal_nexus_60.webp", label: "Entry" }),
      currencyProduct({ sku: "GI-CN-300", slug: "gi-chronal-nexus-300", name: "300 Chronal Nexus", amount: 300, basePrice: 79900, image: "/images/items/gi/chronal_nexus/chronal_nexus_300.webp", label: "Top Choice", isPopular: true }),
      currencyProduct({ sku: "GI-CN-980", slug: "gi-chronal-nexus-980", name: "980 Chronal Nexus", amount: 980, basePrice: 259000, image: "/images/items/gi/chronal_nexus/chronal_nexus_980.webp", label: "Best Value", isBestValue: true }),
      currencyProduct({ sku: "GI-CR-1980", slug: "gi-genesis-crystal-1980", name: "1980 Genesis Crystal", amount: 1980, basePrice: 509000, image: "/images/items/gi/genesis_crystal/genesis_crystal_1980.webp", label: "Sultan Pack", isHot: true }),
      currencyProduct({ sku: "GI-CR-6480", slug: "gi-genesis-crystal-6480", name: "6480 Genesis Crystal", amount: 6480, basePrice: 1659000, image: "/images/items/gi/genesis_crystal/genesis_crystal_6480.webp", label: "Elite Pack", isHot: true }),
      passProduct({ sku: "GI-WELKIN", slug: "welkin-moon", name: "Blessing of the Welkin Moon", basePrice: 55000, image: "/images/items/gi/welkin_moon/blessing_of_the_welkin_moon.webp", label: "Daily Primogem" }),
      bundleProduct({ sku: "GI-BUNDLE-01", slug: "gi-food-crystal-bundle", name: "Food & Crystal Bundle", basePrice: 125000, image: "/images/items/genshin/genshin_promo_bundle_food_and_crystals.webp", label: "Bundle", description: "Bundle promo untuk visual showcase." }),
    ],
  },
  {
    slug: "honkai-star-rail",
    shortCode: "HSR",
    name: "Honkai: Star Rail",
    subtitle: "Oneiric Shards, Express Supply Pass",
    icon: "/images/games/hsr_icon.webp",
    banner: "/images/hero/hero_sci_fi_team_banner.webp",
    accent: "#38BDF8",
    description: "Oneiric Shards dan supply pass ditampilkan sebagai tier produk premium.",
    stats: { online: "7.8K", sold: "44K", rating: "4.95" },
    products: [
      currencyProduct({ sku: "HSR-OS-60", slug: "hsr-oneiric-shard-60", name: "60 Oneiric Shards", amount: 60, basePrice: 17900, image: "/images/items/hsr/oneiric_shards/oneiric_shards_60.webp" }),
      currencyProduct({ sku: "HSR-OS-300", slug: "hsr-oneiric-shard-300", name: "300 Oneiric Shards", amount: 300, basePrice: 89900, image: "/images/items/hsr/oneiric_shards/oneiric_shards_300.webp", isPopular: true }),
      currencyProduct({ sku: "HSR-OS-980", slug: "hsr-oneiric-shard-980", name: "980 Oneiric Shards", amount: 980, basePrice: 289000, image: "/images/items/hsr/oneiric_shards/oneiric_shards_980.webp", isBestValue: true }),
      currencyProduct({ sku: "HSR-OS-1980", slug: "hsr-oneiric-shard-1980", name: "1980 Oneiric Shards", amount: 1980, basePrice: 559000, image: "/images/items/hsr/oneiric_shards/oneiric_shards_1980.webp" }),
      currencyProduct({ sku: "HSR-OS-6480", slug: "hsr-oneiric-shard-6480", name: "6480 Oneiric Shards", amount: 6480, basePrice: 1759000, image: "/images/items/hsr/oneiric_shards/oneiric_shards_6480.webp", isHot: true }),
      passProduct({ sku: "HSR-EXPRESS", slug: "express-supply-pass", name: "Express Supply Pass", basePrice: 72000, image: "/images/items/hsr/pass/express_supply_pass.webp", label: "Monthly Boost", isPopular: true }),
      bundleProduct({ sku: "HSR-DEPARTURE", slug: "departure-bundle", name: "Departure Bundle", basePrice: 148000, image: "/images/items/hsr/bundle/departure_bundle.webp", label: "Starter Bundle" }),
    ],
  },
  {
    slug: "zenless-zone-zero",
    shortCode: "ZZZ",
    name: "Zenless Zone Zero",
    subtitle: "Monochromes, Inter-Knot Membership",
    icon: "/images/games/zzz_icon.webp",
    banner: "/images/hero/hero_anime_duo_action.webp",
    accent: "#22D3EE",
    description: "Monochrome packs dan membership ditata seperti katalog butik modern.",
    stats: { online: "6.2K", sold: "31K", rating: "4.93" },
    products: [
      currencyProduct({ sku: "ZZZ-M-60", slug: "zzz-monochrome-60", name: "60 Monochromes", amount: 60, basePrice: 17900, image: "/images/items/zzz/monochromes/monochromes_60.webp" }),
      currencyProduct({ sku: "ZZZ-M-300", slug: "zzz-monochrome-300", name: "300 Monochromes", amount: 300, basePrice: 88900, image: "/images/items/zzz/monochromes/monochromes_300.webp" }),
      currencyProduct({ sku: "ZZZ-M-980", slug: "zzz-monochrome-980", name: "980 Monochromes", amount: 980, basePrice: 289000, image: "/images/items/zzz/monochromes/monochromes_980.jpeg", isPopular: true }),
      currencyProduct({ sku: "ZZZ-M-1980", slug: "zzz-monochrome-1980", name: "1980 Monochromes", amount: 1980, basePrice: 559000, image: "/images/items/zzz/monochromes/monochromes_1980.webp", isBestValue: true }),
      currencyProduct({ sku: "ZZZ-M-6480", slug: "zzz-monochrome-6480", name: "6480 Monochromes", amount: 6480, basePrice: 1759000, image: "/images/items/zzz/monochromes/monochromes_6480.webp", isHot: true }),
      passProduct({ sku: "ZZZ-MEMB", slug: "inter-knot-membership", name: "Inter-Knot Membership", basePrice: 65000, image: "/images/items/zzz/membership/interknot_membership.webp", label: "Monthly Pass" }),
      bundleProduct({ sku: "ZZZ-ENTRY", slug: "entry-pack", name: "Entry Pack", basePrice: 125000, image: "/images/items/zzz/pack/entrypack.webp", label: "Starter" }),
    ],
  },
  {
    slug: "wuthering-waves",
    shortCode: "WUWA",
    name: "Wuthering Waves",
    subtitle: "Lunites, Subscription, Supply Bundle",
    icon: "/images/games/wuwa_icon.webp",
    banner: "/images/hero/hero_anime_duo_action.webp",
    accent: "#34D399",
    description: "Lunites dan subscription pack disusun dengan nuansa premium futuristik.",
    stats: { online: "5.7K", sold: "24K", rating: "4.92" },
    products: [
      currencyProduct({ sku: "WUWA-L-60", slug: "wuwa-lunite-60", name: "60 Lunites", amount: 60, basePrice: 17900, image: "/images/items/wuwa/lunites/lunites_60.webp" }),
      currencyProduct({ sku: "WUWA-L-300", slug: "wuwa-lunite-300", name: "300 Lunites", amount: 300, basePrice: 88900, image: "/images/items/wuwa/lunites/lunites_300.webp", isPopular: true }),
      currencyProduct({ sku: "WUWA-L-980", slug: "wuwa-lunite-980", name: "980 Lunites", amount: 980, basePrice: 289000, image: "/images/items/wuwa/lunites/lunites_980.webp", isBestValue: true }),
      currencyProduct({ sku: "WUWA-L-1980", slug: "wuwa-lunite-1980", name: "1980 Lunites", amount: 1980, basePrice: 559000, image: "/images/items/wuwa/lunites/lunites_1980.webp" }),
      currencyProduct({ sku: "WUWA-L-6480", slug: "wuwa-lunite-6480", name: "6480 Lunites", amount: 6480, basePrice: 1759000, image: "/images/items/wuwa/lunites/lunites_6480.webp", isHot: true }),
      passProduct({ sku: "WUWA-SUB", slug: "lunite-subscription", name: "Lunite Subscription", basePrice: 69000, image: "/images/items/wuwa/subscription/lunite_subscription.webp", label: "Monthly Pass" }),
      bundleProduct({ sku: "WUWA-BUNDLE", slug: "truthseeker-collection", name: "Truthseeker Forging Collection", basePrice: 149000, image: "/images/items/wuwa/bundle/truthseeker_forging_collection.png", label: "Bundle" }),
    ],
  },
  {
    slug: "arknights-endfield",
    shortCode: "AKEF",
    name: "Arknights: Endfield",
    subtitle: "Origeometry, Monthly Pass, Protocol",
    icon: "/images/games/akef_icon.jpeg",
    banner: "/images/hero/hero_sci_fi_team_banner.webp",
    accent: "#A78BFA",
    description: "Arknights Endfield diberi penamaan bundle dan currency yang lebih tegas.",
    stats: { online: "4.9K", sold: "18K", rating: "4.91" },
    products: [
      currencyProduct({ sku: "AKEF-O-12", slug: "akef-origeometry-12", name: "12 Origeometry", amount: 12, basePrice: 7900, image: "/images/items/akef/origeometry/origeometry_12.png", isHot: true }),
      currencyProduct({ sku: "AKEF-O-42", slug: "akef-origeometry-42", name: "42 Origeometry", amount: 42, basePrice: 14900, image: "/images/items/akef/origeometry/origeometry_42.png" }),
      currencyProduct({ sku: "AKEF-O-68", slug: "akef-origeometry-68", name: "68 Origeometry", amount: 68, basePrice: 20900, image: "/images/items/akef/origeometry/origeometry_68.png", isPopular: true }),
      currencyProduct({ sku: "AKEF-O-114", slug: "akef-origeometry-114", name: "114 Origeometry", amount: 114, basePrice: 28900, image: "/images/items/akef/origeometry/origeometry_114.png" }),
      currencyProduct({ sku: "AKEF-O-388", slug: "akef-origeometry-388", name: "388 Origeometry", amount: 388, basePrice: 82900, image: "/images/items/akef/origeometry/origeometry_388.png", isBestValue: true }),
      currencyProduct({ sku: "AKEF-O-400", slug: "akef-origeometry-400", name: "400 Origeometry", amount: 400, basePrice: 85900, image: "/images/items/akef/origeometry/origeometry_400.png" }),
      passProduct({ sku: "AKEF-MPASS", slug: "monthly-pass", name: "Monthly Pass", basePrice: 69000, image: "/images/items/akef/pass/monthly_pass.png", label: "Monthly Pass" }),
      bundleProduct({ sku: "AKEF-PROTOCOL", slug: "protocol-customized", name: "Protocol Customized", basePrice: 119000, image: "/images/items/akef/protocol/protocol_customized.png", label: "Protocol" }),
    ],
  },
  {
    slug: "pubg-mobile",
    shortCode: "PUBG",
    name: "PUBG Mobile",
    subtitle: "UC, Membership, Bundle",
    icon: "/images/games/pubg_icon.svg",
    banner: "/images/hero/hero_anime_duo_action.webp",
    accent: "#F59E0B",
    description: "PUBG ditampilkan sebagai kartu UC modern, cepat, dan fokus pada value.",
    stats: { online: "8.4K", sold: "33K", rating: "4.94" },
    products: [
      currencyProduct({ sku: "PUBG-UC-60", slug: "pubg-uc-60", name: "60 UC", amount: 60, basePrice: 16900, image: "/images/items/pubg/uc/uc_60.png" }),
      currencyProduct({ sku: "PUBG-UC-300", slug: "pubg-uc-300", name: "300 UC", amount: 300, basePrice: 74900, image: "/images/items/pubg/uc/uc_300.png", isPopular: true }),
      currencyProduct({ sku: "PUBG-UC-600", slug: "pubg-uc-600", name: "600 UC", amount: 600, basePrice: 139000, image: "/images/items/pubg/uc/uc_600.png" }),
      currencyProduct({ sku: "PUBG-UC-1500", slug: "pubg-uc-1500", name: "1500 UC", amount: 1500, basePrice: 329000, image: "/images/items/pubg/uc/uc_1500.png", isBestValue: true }),
      currencyProduct({ sku: "PUBG-UC-6000", slug: "pubg-uc-6000", name: "6000 UC", amount: 6000, basePrice: 1259000, image: "/images/items/pubg/uc/uc_6000.png", isHot: true }),
      passProduct({ sku: "PUBG-ELITE", slug: "pubg-elite-pass", name: "Elite Pass", basePrice: 79000, image: "/images/hero/hero_topup_bundle_03.jpg", label: "Season Pass" }),
    ],
  },
];

export const featuredGames = games.slice(0, 6);

export const liveTransactions = [
  { name: "Sultan***99", game: "MLBB", product: "170 Diamonds", time: "Baru saja" },
  { name: "Kirana***7", game: "Genshin", product: "980 Chronal Nexus", time: "1 menit" },
  { name: "Rizqi***X", game: "HSR", product: "Express Supply Pass", time: "2 menit" },
  { name: "Alya***21", game: "ZZZ", product: "1980 Monochromes", time: "3 menit" },
  { name: "Dimas***88", game: "PUBG", product: "1500 UC", time: "4 menit" },
];

export function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug);
}

export function getBestProvider(product: Product) {
  return product.providerQuotes.digiflazz <= product.providerQuotes.vip
    ? {
        name: "Digiflazz",
        price: product.providerQuotes.digiflazz,
      }
    : {
        name: "VIP Reseller",
        price: product.providerQuotes.vip,
      };
}

export function getProductPrice(product: Product) {
  return getBestProvider(product).price;
}

export function sortByBestValue(products: Product[]) {
  return [...products].sort((a, b) => {
    const aScore = (a.isBestValue ? 1000 : 0) + (a.isPopular ? 300 : 0) + (a.isHot ? 200 : 0);
    const bScore = (b.isBestValue ? 1000 : 0) + (b.isPopular ? 300 : 0) + (b.isHot ? 200 : 0);
    return bScore - aScore || a.basePrice - b.basePrice;
  });
}

export function simulateUsername(gameSlug: string, id: string, zone?: string) {
  const clean = id.replace(/\D/g, "");
  if (clean.length < 6) return null;

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

export function getSelectedPrice(product: Product) {
  return getProductPrice(product);
}
