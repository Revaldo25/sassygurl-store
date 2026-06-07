import { fetchApi } from "./api-client";
import gamesRegistry from "@/shared/registry/games_registry.json";
import gamesManifest from "@/shared/registry/games_manifest.json";
import gamesAliases from "@/shared/registry/games_aliases.json";


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

  const rawProducts: any[] = gameData.products ?? [];
  const rawGrouped: any[]  = gameData.groupedProducts ?? [];

  // Enforce strict category rules: filter out UNKNOWN or uncategorized items
  const validProducts = rawProducts.filter((p: any) => 
    p.itemCategory && p.itemCategory.toUpperCase() !== 'UNKNOWN'
  );

  const products = validProducts.map((p: any) => mapProduct(p, slug));
  const prices   = products.map(p => p.displayPrice).filter(v => v > 0);

  const groupedProducts: GroupedProducts[] = rawGrouped
    .filter(g => g.category?.slug && g.category.slug.toUpperCase() !== 'UNKNOWN')
    .map(g => ({
      category: {
        slug:      g.category.slug,
        label:     g.category.label ?? "Item",
        icon:      g.category.icon ?? "💎",
        itemCount: g.category.itemCount ?? 0,
        sortOrder: g.category.sortOrder ?? 0,
      },
      items: (g.items ?? [])
        .filter((p: any) => p.itemCategory && p.itemCategory.toUpperCase() !== 'UNKNOWN')
        .map((p: any) => mapProduct(p, slug)),
    }))
    .filter(g => g.items.length > 0); // Drop empty groups

  const itemCategories: ItemCategory[] = (gameData.itemCategories ?? [])
    .filter((c: any) => c.slug && c.slug.toUpperCase() !== 'UNKNOWN')
    .map((c: any) => ({
      slug:      c.slug,
      label:     c.label,
      icon:      c.icon,
      itemCount: c.itemCount,
      sortOrder: c.sortOrder,
    }));

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

export async function getAllGamesNormalized(): Promise<NormalizedGame[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>("/catalog/games");
    if (!response.success) return [];

    return response.data.map(g => {
      const canonicalSlug = (gamesAliases as Record<string, string>)[g.slug.toLowerCase()] || g.slug;
      const manifest = (gamesManifest as Record<string, any>)[canonicalSlug];
      const registryEntry = gamesRegistry.find(r => r.slug === canonicalSlug);
      return {
        id:             g.id,
        slug:           g.slug,
        name:           registryEntry?.display_title ?? g.name,
        shortCode:      registryEntry?.short_names?.[0] ?? g.name?.substring(0, 4).toUpperCase() ?? g.slug.toUpperCase(),
        currencyName:   g.currencyName ?? "Item",
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
