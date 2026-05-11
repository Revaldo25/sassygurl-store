import { fetchApi } from "./api-client";

// ============================================================================
// TYPES — mirror backend DTOs exactly
// ============================================================================

export type NormalizedProduct = {
  id: string;
  sku: string;
  name: string;
  itemCategory: string;        // CURRENCY | PASS | BUNDLE | SUBSCRIPTION | SKIN | OTHER
  itemCategoryLabel: string;   // e.g. "Weekly Diamond Pass"
  itemCategoryIcon: string;    // e.g. "🎫"
  thumbnail?: string;
  displayPrice: number;
  originalPrice?: number;
  discountPercent: number;
  isFlashSale: boolean;
  inStock: boolean;
  providerName: string;
  badges: string[];
  image: string;
};

export type ItemCategory = {
  slug: string;
  label: string;
  icon: string;
  itemCount: number;
  sortOrder: number;
};

export type GroupedProducts = {
  category: ItemCategory;
  items: NormalizedProduct[];
};

export type NormalizedGame = {
  id: string;
  slug: string;
  name: string;
  shortCode: string;
  currencyName: string;
  icon: string;
  banner: string;
  coverImage?: string;
  guideImage?: string;
  accent: string;
  description: string;
  productCount: number;
  hasServerId: boolean;
  isHot: boolean;
  serverOptions?: string;
  itemCategories: ItemCategory[];
  groupedProducts: GroupedProducts[];
  products: NormalizedProduct[];   // flat — backward compat
  priceRange: { min: number; max: number };
};

export type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  type: string;
  logo?: string;
  feeFlat: number;
  feePercent: number;
  sortOrder: number;
};

export type PaymentGroup = {
  groupKey: string;
  groupLabel: string;
  countryFlag: string;
  sortOrder: number;
  methods: PaymentMethod[];
};

export type ProviderStatus = {
  name: string;
  isActive: boolean;
  successRate: number;
  avgLatency: string;
  lastChecked: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// ── Game accent colors (slug → hex) ─────────────────────────────────────────
const GAME_ACCENTS: Record<string, string> = {
  mlbb:       "#FDB0C0",   // sakura pink
  ff:         "#FF6B35",   // orange
  pubg:       "#F0C040",   // gold
  genshin:    "#A8E6CF",   // mint
  hsr:        "#7EC8E3",   // sky blue
  zzz:        "#C084FC",   // purple
  valorant:   "#FF4655",   // red
  wuwa:       "#60A5FA",   // blue
  hok:        "#F59E0B",   // amber
  nikke:      "#F472B6",   // pink
  lol:        "#C4B454",   // gold
  lolwr:      "#22D3EE",   // cyan
  roblox:     "#E11D48",   // rose
  akef:       "#A78BFA",   // violet
  mccg:       "#60A5FA",   // blue
};

const GAME_DESCRIPTIONS: Record<string, string> = {
  mlbb:       "Top up Mobile Legends Diamond termurah, teraman, dan terpercaya! Proses instan.",
  ff:         "Top up Diamond Free Fire (FF) dengan harga terbaik dan proses super cepat.",
  pubg:       "Top up UC PUBG Mobile paling murah. Diproses otomatis dalam hitungan detik.",
  genshin:    "Top up Genesis Crystal & Welkin Moon Genshin Impact tanpa ribet. Harga bersaing.",
  hsr:        "Top up Oneiric Shard Honkai: Star Rail tercepat dan termurah di Indonesia.",
  zzz:        "Top up Monochrome Zenless Zone Zero harga terbaik, langsung masuk akun.",
  valorant:   "Top up Valorant Points (VP) resmi dan aman. Pengiriman instan ke akun kamu.",
  wuwa:       "Top up Lunite Wuthering Waves murah dan cepat. Proses otomatis 24 jam.",
  hok:        "Top up Token Honor of Kings harga termurah. Langsung masuk ke akun.",
  nikke:      "Top up Gem NIKKE: Goddess of Victory harga spesial dan proses instan.",
  lol:        "Top up Riot Points League of Legends resmi. Harga kompetitif.",
  lolwr:      "Top up Wild Core LoL: Wild Rift cepat dan aman. Harga terbaik.",
  roblox:     "Top up Robux Roblox murah dan terpercaya. Proses otomatis.",
  akef:       "Top up Origeometry Aether Gazer harga spesial dan proses instan.",
  mccg:       "Top up Magic Chess: Go Go Weekly Pass dan item lainnya.",
};

// ── Map raw API product to NormalizedProduct ─────────────────────────────────
function mapProduct(p: any, gameSlug: string): NormalizedProduct {
  const displayPrice = p.price > 0 ? p.price : (p.originalPrice ?? 0);
  const origPrice = p.originalPrice ?? 0;

  return {
    id:                 p.id,
    sku:                p.sku,
    name:               p.name,
    itemCategory:       p.itemCategory ?? "CURRENCY",
    itemCategoryLabel:  p.itemCategoryLabel ?? "Item",
    itemCategoryIcon:   p.itemCategoryIcon ?? "💎",
    thumbnail:          p.thumbnail,
    displayPrice,
    originalPrice:      origPrice > displayPrice ? origPrice : undefined,
    discountPercent:    p.discountPercent ?? 0,
    isFlashSale:        p.isFlashSale ?? false,
    inStock:            (p.stock ?? 99999) > 0,
    providerName:       "Auto",
    badges:             p.isFlashSale ? ["Flash Sale"] : [],
    image:              p.thumbnail ?? `/images/products/${gameSlug}/default.webp`,
  };
}

// ============================================================================
// LOCAL ASSET MAPPING (from public/images/games/ and public/images/hero/)
// ============================================================================
const LOCAL_ASSETS: Record<string, { icon: string, banner: string }> = {
  "mlbb":     { icon: "/images/games/mlbb_icon.jpeg",     banner: "/images/hero/hero_anime_duo_action.webp" },
  "ff":       { icon: "/images/games/ff_icon.jpeg",        banner: "/images/hero/hero_topup_bundle_03.jpg" },
  "genshin":  { icon: "/images/games/gi_icon.jpeg",        banner: "/images/hero/hero_genshin_fantasy_battle.webp" },
  "hsr":      { icon: "/images/games/hsr_icon.webp",       banner: "/images/hero/hero_sci_fi_team_banner.webp" },
  "zzz":      { icon: "/images/games/zzz_icon.webp",       banner: "/images/hero/hero_anime_duo_action.webp" },
  "wuwa":     { icon: "/images/games/wuwa_icon.webp",      banner: "/images/hero/hero_genshin_fantasy_battle.webp" },
  "pubg":     { icon: "/images/games/pubg_icon.svg",       banner: "/images/hero/hero_topup_bundle_03.jpg" },
  "valorant": { icon: "/images/games/valorant_icon.jpeg",  banner: "/images/hero/hero_sci_fi_team_banner.webp" },
  "hok":      { icon: "/images/games/hok_icon.jpeg",       banner: "/images/hero/hero_anime_duo_action.webp" },
  "nikke":    { icon: "/images/games/nikke_icon.jpeg",     banner: "/images/hero/hero_sci_fi_team_banner.webp" },
  "lol":      { icon: "/images/games/lol_icon.jpeg",       banner: "/images/hero/hero_topup_bundle_03.jpg" },
  "lolwr":    { icon: "/images/games/lolwr_icon.jpeg",     banner: "/images/hero/hero_anime_duo_action.webp" },
  "roblox":   { icon: "/images/games/rbx_icon.png",        banner: "/images/hero/hero_topup_bundle_03.jpg" },
  "akef":     { icon: "/images/games/akef_icon.jpeg",      banner: "/images/hero/hero_genshin_fantasy_battle.webp" },
  "mccg":     { icon: "/images/games/mccg_icon.jpeg",      banner: "/images/hero/hero_anime_duo_action.webp" },
};


// ── Map raw API game to NormalizedGame ───────────────────────────────────────
function mapGame(gameData: any): NormalizedGame {
  const slug = gameData.slug;
  const assets = LOCAL_ASSETS[slug];
  const rawProducts: any[] = gameData.products ?? [];
  const rawGrouped: any[]  = gameData.groupedProducts ?? [];

  const products = rawProducts.map(p => mapProduct(p, slug));
  const prices   = products.map(p => p.displayPrice).filter(v => v > 0);

  const groupedProducts: GroupedProducts[] = rawGrouped.map(g => ({
    category: {
      slug:      g.category?.slug ?? "CURRENCY",
      label:     g.category?.label ?? "Item",
      icon:      g.category?.icon ?? "💎",
      itemCount: g.category?.itemCount ?? 0,
      sortOrder: g.category?.sortOrder ?? 0,
    },
    items: (g.items ?? []).map((p: any) => mapProduct(p, slug)),
  }));

  const itemCategories: ItemCategory[] = gameData.itemCategories?.map((c: any) => ({
    slug:      c.slug,
    label:     c.label,
    icon:      c.icon,
    itemCount: c.itemCount,
    sortOrder: c.sortOrder,
  })) ?? [];

  return {
    id:             gameData.id,
    slug,
    name:           gameData.name,
    shortCode:      gameData.name?.substring(0, 4).toUpperCase() ?? slug.toUpperCase(),
    currencyName:   gameData.currencyName ?? "Item",
    icon:           assets?.icon ?? gameData.thumbnail ?? `/images/games/${slug}-icon.webp`,
    banner:         assets?.banner ?? gameData.banner    ?? `/images/games/${slug}-banner.webp`,
    coverImage:     assets?.banner ?? gameData.banner    ?? `/images/games/${slug}-banner.webp`,
    guideImage:     gameData.guideImage,
    accent:         GAME_ACCENTS[slug] ?? "#FDB0C0",
    description:    GAME_DESCRIPTIONS[slug] ?? "Top up game terpercaya dan termurah!",
    productCount:   products.length,
    hasServerId:    gameData.hasServerId ?? false,
    isHot:          gameData.isHot ?? false,
    serverOptions:  gameData.serverOptions,
    itemCategories,
    groupedProducts,
    products,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    },
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function getAllGamesNormalized(): Promise<NormalizedGame[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>("/catalog/games");
    if (!response.success) return [];

    return response.data.map(g => {
      const assets = LOCAL_ASSETS[g.slug];
      return {
        id:             g.id,
        slug:           g.slug,
        name:           g.name,
        shortCode:      g.name?.substring(0, 4).toUpperCase() ?? g.slug.toUpperCase(),
        currencyName:   g.currencyName ?? "Item",
        icon:           assets?.icon ?? g.thumbnail ?? `/images/games/${g.slug}-icon.webp`,
        banner:         assets?.banner ?? g.banner    ?? `/images/games/${g.slug}-banner.webp`,
        coverImage:     assets?.banner ?? g.banner    ?? `/images/games/${g.slug}-banner.webp`,
        guideImage:     g.guideImage,
        accent:         GAME_ACCENTS[g.slug] ?? "#FDB0C0",
        description:    GAME_DESCRIPTIONS[g.slug] ?? "Top up game terpercaya dan termurah!",
        productCount:   0,
        hasServerId:    g.hasServerId ?? false,
        isHot:          g.isHot ?? false,
        serverOptions:  g.serverOptions,
        itemCategories: [],
        groupedProducts: [],
        products:       [],
        priceRange:     { min: 0, max: 0 },
      };
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
}

export async function getGameProducts(slug: string): Promise<{
  game: NormalizedGame | null;
  products: NormalizedProduct[];
  groupedByCategory: GroupedProducts[];
}> {
  try {
    const response = await fetchApi<ApiResponse<any>>(`/catalog/games/${slug}`);
    if (!response.success || !response.data)
      return { game: null, products: [], groupedByCategory: [] };

    const game = mapGame(response.data);
    return {
      game,
      products:          game.products,
      groupedByCategory: game.groupedProducts,
    };
  } catch (error) {
    console.error("Error fetching game products:", error);
    return { game: null, products: [], groupedByCategory: [] };
  }
}

export async function getPayments(): Promise<PaymentMethod[]> {
  try {
    const response = await fetchApi<ApiResponse<PaymentMethod[]>>("/catalog/payments");
    if (!response.success) return [];
    return response.data;
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}

export async function getGroupedPayments(): Promise<PaymentGroup[]> {
  try {
    const response = await fetchApi<ApiResponse<PaymentGroup[]>>("/catalog/payments/grouped");
    if (!response.success) return [];
    return response.data;
  } catch (error) {
    console.error("Error fetching grouped payments:", error);
    return [];
  }
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>("/catalog/providers/status");
    if (!response.success) return [];

    return response.data.map(p => ({
      name:        p.name,
      isActive:    p.isActive,
      successRate: p.successRate,
      avgLatency:  `${p.avgLatency}ms`,
      lastChecked: p.lastChecked,
    }));
  } catch (error) {
    console.error("Error fetching provider status:", error);
    return [];
  }
}
