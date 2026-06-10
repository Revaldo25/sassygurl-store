const fs = require('fs');

let content = fs.readFileSync('lib/api-adapter.ts', 'utf8');

const oldGetAll = `export async function getAllGamesNormalized(): Promise<NormalizedGame[]> {
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
}`;

const newGetAll = `export async function getAllGamesNormalized(): Promise<NormalizedGame[]> {
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
          currencyName: r.currency_name ?? "Item",
          icon: manifest?.icon ?? FALLBACK_ICON,
          banner: manifest?.banner ?? FALLBACK_BANNER,
          coverImage: manifest?.banner ?? FALLBACK_BANNER,
          guideImage: undefined,
          accent: manifest?.accent ?? "#FDB0C0",
          description: r.description ?? "Top up game terpercaya dan termurah!",
          productCount: 0,
          hasServerId: r.has_server_id ?? false,
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
}`;

content = content.replace(oldGetAll, newGetAll);
fs.writeFileSync('lib/api-adapter.ts', content);
console.log('Done padding missing games!');
