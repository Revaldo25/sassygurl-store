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
  "free-fire": "#FF6B35",  // orange
  pubg:       "#F0C040",   // gold
  genshin:    "#A8E6CF",   // mint
  "star-rail":  "#7EC8E3", // sky blue
  zzz:        "#C084FC",   // purple
  valorant:   "#FF4655",   // red
  "magic-chess": "#60A5FA", // blue
};

const GAME_DESCRIPTIONS: Record<string, string> = {
  mlbb:       "Top up Mobile Legends Diamond termurah, teraman, dan terpercaya! Proses instan.",
  "free-fire": "Top up Diamond Free Fire (FF) dengan harga terbaik dan proses super cepat.",
  pubg:       "Top up UC PUBG Mobile paling murah. Diproses otomatis dalam hitungan detik.",
  genshin:    "Top up Primogem Genshin Impact tanpa ribet. Harga bersaing, aman, dan instan.",
  "star-rail": "Top up Stellar Jade Honkai: Star Rail tercepat dan termurah di Indonesia.",
  zzz:        "Top up Polychrome Zenless Zone Zero harga terbaik, langsung masuk akun.",
  valorant:   "Top up Valorant Points (VP) resmi dan aman. Pengiriman instan ke akun kamu.",
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
// REAL IMAGE OVERRIDES (FOR UI PREVIEW)
// ============================================================================
const REAL_ASSETS: Record<string, { icon: string, banner: string, cover: string }> = {
  "mlbb": {
    icon: "https://play-lh.googleusercontent.com/f02oN8_y3m28N8x4uC_32uHwGqT6VjB6x7X6ZfM2_5pS_P2b-wP9U5uFpXJ98L5sA",
    banner: "https://esports.id/img/article/5753/2021/09/16/mobile-legends-bang-bang-hadirkan-project-next-dengan-grafis-dan-ui-baru-661132.jpg",
    cover: "https://i.pinimg.com/736x/8b/66/8f/8b668f4e2f9d5051a8f94e9f7831d044.jpg"
  },
  "genshin-impact": {
    icon: "https://play-lh.googleusercontent.com/k2H99-hW_Q0L-bQW6R2XU3k-0MvXjEaOQ_e-UqD-a-m-u6F3G0sX-vVpQO6A_8mHQQ",
    banner: "https://images.hdqwalls.com/download/genshin-impact-4k-2020-0a-1280x400.jpg",
    cover: "https://i.pinimg.com/736x/7d/cc/43/7dcc43c17800c732fc016ba84c424076.jpg"
  },
  "pubg-mobile": {
    icon: "https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yO2PUENXmR1Q2XwYJ2R9H3tVwXnOaO9pX0E",
    banner: "https://images.hdqwalls.com/download/pubg-mobile-4k-2020-8v-1280x400.jpg",
    cover: "https://i.pinimg.com/736x/8f/c9/76/8fc976ab94ea26402ecf048d2d667c13.jpg"
  },
  "valorant": {
    icon: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg",
    banner: "https://images.hdqwalls.com/download/valorant-game-2020-4k-pf-1280x400.jpg",
    cover: "https://i.pinimg.com/736x/01/f9/ba/01f9ba010b9eb020ab1609121a5cfb07.jpg"
  },
  "honkai-star-rail": {
    icon: "https://play-lh.googleusercontent.com/rN9k4T3nL1rD9P3Q8b7dJp4x9657-pD_XvE-Oq1A1x3w3fMvQ9-0-pT8WpQ8cI6r1w",
    banner: "https://images.hdqwalls.com/download/honkai-star-rail-8k-t2-1280x400.jpg",
    cover: "https://i.pinimg.com/736x/a6/50/35/a650352518f8ab621ec68c34dc4c3821.jpg"
  },
  "zenless-zone-zero": {
    icon: "https://play-lh.googleusercontent.com/YgW1N1zVvKxGZ0Xn3V1E1A3J8oR5O2y-1S1nK8vP3N9F1oG4M5tX8_1N3yC0Z8vT7w",
    banner: "https://images.hdqwalls.com/download/zenless-zone-zero-4k-gq-1280x400.jpg",
    cover: "https://i.pinimg.com/736x/5f/c7/27/5fc7270b22a611c0ed923f59cd3e84cd.jpg"
  }
};

// ── Map raw API game to NormalizedGame ───────────────────────────────────────
function mapGame(gameData: any): NormalizedGame {
  const slug = gameData.slug;
  const assets = REAL_ASSETS[slug];
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
    coverImage:     assets?.cover ?? gameData.banner     ?? `/images/games/${slug}-banner.webp`,
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
      const assets = REAL_ASSETS[g.slug];
      return {
        id:             g.id,
        slug:           g.slug,
        name:           g.name,
        shortCode:      g.name?.substring(0, 4).toUpperCase() ?? g.slug.toUpperCase(),
        currencyName:   g.currencyName ?? "Item",
        icon:           assets?.icon ?? g.thumbnail ?? `/images/games/${g.slug}-icon.webp`,
        banner:         assets?.banner ?? g.banner    ?? `/images/games/${g.slug}-banner.webp`,
        coverImage:     assets?.cover ?? g.banner     ?? `/images/games/${g.slug}-banner.webp`,
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
