import { fetchApi } from "./api-client";
import gamesRegistry from "@/shared/registry/games_registry.json";
import gamesManifest from "@/shared/registry/games_manifest.json";
import gamesAliases from "@/shared/registry/games_aliases.json";
import { getRealProductsForGame } from "@/shared/registry/real_catalog";


// ============================================================================
// ERROR HANDLING — callers should use try/catch for proper error states
// ============================================================================
export class ApiAdapterError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ApiAdapterError';
  }
}

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
  publisher?: string;
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

export interface ProviderStatus {
  name: string;
  isActive: boolean;
  successRate: number;
  avgLatency: number;
  lastChecked: string;
  balance: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// ── Map raw API product to NormalizedProduct ─────────────────────────────────
function mapProduct(p: any, gameSlug: string): NormalizedProduct {
  const displayPrice = p.price > 0 ? p.price : (p.originalPrice ?? 0);
  const origPrice = p.originalPrice ?? 0;

  return {
    id:                 p.id,
    sku:                p.sku,
    name: p.name,
    itemCategory: p.itemCategory ?? "CURRENCY",
    itemCategoryLabel: p.itemCategoryLabel ?? "Item",
    itemCategoryIcon: p.itemCategoryIcon ?? "💎",
    thumbnail:          p.thumbnail,
    displayPrice,
    originalPrice:      origPrice > displayPrice ? origPrice : undefined,
    discountPercent:    p.discountPercent ?? 0,
    isFlashSale: p.isFlashSale ?? false,
    inStock:            (p.stock ?? 99999) > 0,
    providerName:       "Auto",
    badges:             p.isFlashSale ? ["Flash Sale"] : [],
    image:              p.thumbnail ?? `/images/products/${gameSlug}/default.webp`,
  };
}

// ── Centralized fallback paths from manifest ────────────────────────────────
const manifestFallbacks = (gamesManifest as Record<string, any>)["_fallbacks"] ?? {};
const FALLBACK_ICON   = manifestFallbacks.icon   ?? "/images/fallbacks/game-default-icon.svg";
const FALLBACK_BANNER = manifestFallbacks.banner ?? "/images/fallbacks/game-default-banner.jpg";

// ── Map raw API game to NormalizedGame ───────────────────────────────────────
function mapGame(gameData: any): NormalizedGame {
  const slug = gameData.slug;
  const canonicalSlug = (gamesAliases as Record<string, string>)[slug.toLowerCase()] || slug;
  const manifest = (gamesManifest as Record<string, any>)[canonicalSlug];
  const registryEntry = gamesRegistry.find(g => g.slug === canonicalSlug);

  // USE API DATA IF AVAILABLE, OTHERWISE FALLBACK TO REGISTRY
  let products: NormalizedProduct[] = [];
  let itemCategories: ItemCategory[] = [];
  let groupedProducts: GroupedProducts[] = [];

  if (gameData.products && gameData.products.length > 0) {
    products = gameData.products.map((p: any) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      itemCategory: p.itemCategory,
      itemCategoryLabel: p.itemCategoryLabel,
      itemCategoryIcon: p.itemCategoryIcon,
      thumbnail: p.thumbnail,
      displayPrice: p.price,
      originalPrice: p.originalPrice,
      discountPercent: p.discountPercent,
      isFlashSale: p.isFlashSale,
      inStock: p.stock > 0,
      providerName: p.providerName || "Auto",
      badges: p.discountPercent > 0 ? [`${p.discountPercent}% OFF`] : [],
      image: p.thumbnail || `/images/products/${slug}/default.webp`
    }));

    if (gameData.groupedProducts) {
      groupedProducts = gameData.groupedProducts.map((g: any) => ({
        category: g.category,
        items: products.filter(p => p.itemCategory === g.category.slug)
      }));
      itemCategories = gameData.itemCategories || groupedProducts.map(g => g.category);
    } else {
      const groups: Record<string, NormalizedProduct[]> = {};
      products.forEach(p => {
        if (!groups[p.itemCategory]) groups[p.itemCategory] = [];
        groups[p.itemCategory].push(p);
      });
      groupedProducts = Object.keys(groups).map((cat, index) => ({
        category: { slug: cat, label: cat, icon: "💎", itemCount: groups[cat].length, sortOrder: index },
        items: groups[cat]
      }));
      itemCategories = groupedProducts.map(g => g.category);
    }
  } else {
    // FALLBACK
    const realProducts = getRealProductsForGame(canonicalSlug, gameData.currencyName ?? "Item");
    products = realProducts.map((p, index) => {
      return {
        id: `real-${canonicalSlug}-${index}`,
        sku: `SKU-${canonicalSlug}-${index}`,
        name: p.name,
        itemCategory: p.type,
        itemCategoryLabel: p.type === "PASS" ? "Membership & Pass" : "Top Up",
        itemCategoryIcon: p.type === "PASS" ? "🎫" : "💎",
        thumbnail: undefined,
        displayPrice: p.price,
        originalPrice: p.originalPrice > p.price ? p.originalPrice : undefined,
        discountPercent: p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0,
        isFlashSale: p.type === "PASS",
        inStock: true,
        providerName: "Auto",
        badges: p.originalPrice > p.price ? [`${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% OFF`] : [],
        image: `/images/products/${slug}/default.webp`,
      };
    });

    const groups: Record<string, NormalizedProduct[]> = {};
    products.forEach(p => {
      if (!groups[p.itemCategory]) groups[p.itemCategory] = [];
      groups[p.itemCategory].push(p);
    });

    groupedProducts = Object.keys(groups).map((categoryType, index) => {
      const isPass = categoryType === "PASS";
      return {
        category: {
          slug: categoryType.toLowerCase(),
          label: isPass ? "Membership & Pass" : "Top Up Items",
          icon: isPass ? "🎫" : "💎",
          itemCount: groups[categoryType].length,
          sortOrder: index,
        },
        items: groups[categoryType]
      };
    });

    itemCategories = groupedProducts.map(g => g.category);
  }

  const prices = products.map(p => p.displayPrice).filter(v => v > 0);

  return {
    id:             gameData.id,
    slug,
    name:           registryEntry?.display_title ?? gameData.name,
    shortCode:      registryEntry?.short_names?.[0] ?? gameData.name?.substring(0, 4).toUpperCase() ?? slug.toUpperCase(),
    currencyName:   gameData.currencyName ?? "Item",
    icon:           manifest?.icon ?? gameData.thumbnail ?? FALLBACK_ICON,
    banner:         manifest?.banner ?? gameData.banner    ?? FALLBACK_BANNER,
    coverImage:     manifest?.banner ?? gameData.banner    ?? FALLBACK_BANNER,
    guideImage:     gameData.guideImage,
    accent:         manifest?.accent ?? "#FDB0C0",
    description:    registryEntry?.description ?? "Top up game terpercaya dan termurah!",
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
export async function getAllGamesNormalized(): Promise<NormalizedGame[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>("/catalog/games");
    const fetchedGames = response.success && response.data ? response.data : [];

    const normalizedGames = fetchedGames.map(g => {
      const canonicalSlug = (gamesAliases as Record<string, string>)[g.slug.toLowerCase()] || g.slug;
      const manifest = (gamesManifest as Record<string, any>)[canonicalSlug];
      const registryEntry = gamesRegistry.find(r => r.slug === canonicalSlug);
      return {
        id:             g.id,
        slug:           g.slug,
        name:           registryEntry?.display_title ?? g.name,
        shortCode:      registryEntry?.short_names?.[0] ?? g.name?.substring(0, 4).toUpperCase() ?? g.slug.toUpperCase(),
        currencyName: CURRENCY_MAP[canonicalSlug] || g.currencyName || "Item",
        icon:           manifest?.icon ?? g.thumbnail ?? FALLBACK_ICON,
        banner:         manifest?.banner ?? g.banner    ?? FALLBACK_BANNER,
        coverImage:     manifest?.banner ?? g.banner    ?? FALLBACK_BANNER,
        guideImage:     g.guideImage,
        accent:         manifest?.accent ?? "#FDB0C0",
        description:    registryEntry?.description ?? "Top up game terpercaya dan termurah!",
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

    const fetchedSlugs = new Set(normalizedGames.map(g => g.slug.toLowerCase()));
    
    // Pad with missing games from registry so we always show all 21 games!
    gamesRegistry.forEach(r => {
      const slug = r.slug;
      if (!fetchedSlugs.has(slug.toLowerCase())) {
        const manifest = (gamesManifest as Record<string, any>)[slug];
        normalizedGames.push({
          id: slug,
          slug: slug,
          name: r.display_title,
          shortCode: r.short_names?.[0] ?? slug.toUpperCase(),
          currencyName: CURRENCY_MAP[slug] || "Item",
          icon: manifest?.icon ?? FALLBACK_ICON,
          banner: manifest?.banner ?? FALLBACK_BANNER,
          coverImage: manifest?.banner ?? FALLBACK_BANNER,
          guideImage: undefined,
          accent: manifest?.accent ?? "#FDB0C0",
          description: r.description ?? "Top up game terpercaya dan termurah!",
          productCount: 0,
          hasServerId: false,
          isHot: false,
          serverOptions: [],
          itemCategories: [],
          groupedProducts: [],
          products: [],
          priceRange: { min: 0, max: 0 }
        });
      }
    });

    return normalizedGames;
  } catch (error) {
    console.error("Error fetching games:", error);
    throw new ApiAdapterError(
      'Failed to load game catalog. Please try again.',
      '/catalog/games',
      error
    );
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
    throw new ApiAdapterError(
      `Failed to load products for ${slug}. Please try again.`,
      `/catalog/games/${slug}`,
      error
    );
  }
}

export async function getPayments(): Promise<PaymentMethod[]> {
  try {
    const response = await fetchApi<ApiResponse<PaymentMethod[]>>("/catalog/payments");
    if (!response.success) return [];
    return response.data;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new ApiAdapterError(
      'Failed to load payment methods. Please try again.',
      '/catalog/payments',
      error
    );
  }
}

export async function getGroupedPayments(): Promise<PaymentGroup[]> {
  try {
    const response = await fetchApi<ApiResponse<PaymentGroup[]>>("/catalog/payments/grouped");
    if (!response.success) return [];
    return response.data;
  } catch (error) {
    console.error("Error fetching grouped payments:", error);
    throw new ApiAdapterError(
      'Failed to load payment options. Please try again.',
      '/catalog/payments/grouped',
      error
    );
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
      avgLatency:  p.avgLatency,
      lastChecked: p.lastChecked,
      balance:     p.balance ?? 0,
    }));
  } catch (error) {
    console.error("Error fetching provider status:", error);
    throw new ApiAdapterError(
      'Failed to load provider status. Please try again.',
      '/catalog/providers/status',
      error
    );
  }
}

export type RecentTransaction = {
  maskedTarget: string;
  gameName: string;
  productName: string;
  timestamp: string;
};

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  try {
    const response = await fetchApi<ApiResponse<RecentTransaction[]>>("/Transactions/recent");
    if (!response.success) return [];
    return response.data;
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return []; // Return empty array on error so UI doesn't break
  }
}
