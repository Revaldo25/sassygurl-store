import { PrismaClient, PaymentType } from "@prisma/client";
import { games, paymentMethods, getBestProvider } from "../lib/catalog";

const prisma = new PrismaClient();

async function seedCategories() {
  const category = await prisma.category.upsert({
    where: { slug: "premium-topup" },
    update: { name: "Premium Top-Up", sortOrder: 1 },
    create: { name: "Premium Top-Up", slug: "premium-topup", sortOrder: 1 },
  });

  return category;
}

async function seedProviders() {
  const digiflazz = await prisma.provider.upsert({
    where: { name: "Digiflazz" },
    update: { isActive: true, successRate: 99.2, avgLatencyMs: 780 },
    create: { name: "Digiflazz", isActive: true, successRate: 99.2, avgLatencyMs: 780 },
  });

  const vip = await prisma.provider.upsert({
    where: { name: "VIP Reseller" },
    update: { isActive: true, successRate: 98.8, avgLatencyMs: 620 },
    create: { name: "VIP Reseller", isActive: true, successRate: 98.8, avgLatencyMs: 620 },
  });

  return { digiflazz, vip };
}

async function main() {
  console.log("🌙 Seeding SassyGurl Store Ultra...");

  const category = await seedCategories();
  const providers = await seedProviders();

  for (const gameData of games) {
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: {
        name: gameData.name,
        publisher: gameData.shortCode,
        thumbnail: gameData.icon,
        banner: gameData.banner,
        guideImage: gameData.banner,
        isHot: gameData.isFeatured ?? false,
        isActive: true,
      },
      create: {
        categoryId: category.id,
        name: gameData.name,
        slug: gameData.slug,
        publisher: gameData.shortCode,
        thumbnail: gameData.icon,
        banner: gameData.banner,
        guideImage: gameData.banner,
        hasServerId: true,
        isHot: gameData.isFeatured ?? false,
        isActive: true,
      },
    });

    for (const productData of gameData.products) {
      const providerQuote = getBestProvider(productData);
      const providerId = providerQuote.name === "Digiflazz" ? providers.digiflazz.id : providers.vip.id;

      await prisma.product.upsert({
        where: { sku: productData.sku },
        update: {
          name: productData.name,
          description: productData.description ?? productData.label ?? null,
          priceModal: providerQuote.price,
          priceSell: providerQuote.price,
          priceMember: Math.round(providerQuote.price * 0.99),
          priceReseller: Math.round(providerQuote.price * 0.985),
          priceVip: Math.round(providerQuote.price * 0.97),
          originalPrice: productData.basePrice,
          isActive: true,
          isFlashSale: Boolean(productData.isHot),
          stock: 99999,
          providerId,
          gameId: game.id,
        },
        create: {
          gameId: game.id,
          providerId,
          sku: productData.sku,
          name: productData.name,
          description: productData.description ?? productData.label ?? null,
          priceModal: providerQuote.price,
          priceSell: providerQuote.price,
          priceMember: Math.round(providerQuote.price * 0.99),
          priceReseller: Math.round(providerQuote.price * 0.985),
          priceVip: Math.round(providerQuote.price * 0.97),
          originalPrice: productData.basePrice,
          isActive: true,
          isFlashSale: Boolean(productData.isHot),
          stock: 99999,
        },
      });
    }
  }

  for (const method of paymentMethods) {
    const type =
      method.type === "QRIS"
        ? PaymentType.QRIS
        : method.type === "EWALLET"
          ? PaymentType.EWALLET
          : method.type === "VIRTUAL_ACCOUNT"
            ? PaymentType.VIRTUAL_ACCOUNT
            : PaymentType.RETAIL;

    await prisma.paymentMethod.upsert({
      where: { code: method.code },
      update: {
        name: method.name,
        type,
        logo: method.icon,
        feeFlat: method.feeFlat,
        feePercent: method.feePercent,
        isActive: true,
        sortOrder: method.highlight ? 0 : 1,
      },
      create: {
        code: method.code,
        name: method.name,
        type,
        logo: method.icon,
        feeFlat: method.feeFlat,
        feePercent: method.feePercent,
        isActive: true,
        sortOrder: method.highlight ? 0 : 1,
      },
    });
  }

  console.log("✅ Seed selesai. Games, products, providers, dan payment methods tersinkron.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
