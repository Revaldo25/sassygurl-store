import { PrismaClient, Role, KycStatus, PaymentType, PromoType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai Operasi 'Titan' Seeding SassyGurlStore Elite...");

  // 1. PEMBERSIHAN DATA (CLEAN SLATE) - Urutan sangat penting karena relasi FK
  await prisma.systemAudit.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.walletLedger.deleteMany();
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.game.deleteMany();
  await prisma.category.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database bersih mengkilap. Membangun fondasi...");

  // 2. SEED PROVIDERS (Supplier Diamond)
  const providers = await Promise.all([
    prisma.provider.create({ data: { name: "DIGIFLAZZ", balance: 100000000 } }),
    prisma.provider.create({ data: { name: "VIP_RESELLER", balance: 50000000 } }),
    prisma.provider.create({ data: { name: "APIGAMES", balance: 75000000 } }),
  ]);

  // 3. SEED ADMIN & VIP USERS
  const admin = await prisma.user.create({
    data: {
      name: "Sultan Sassy Admin",
      email: "admin@sassygurl.com",
      phone: "081122334455",
      role: Role.SUPERADMIN,
      kycStatus: KycStatus.VERIFIED,
      referralCode: "SASSY-BOSS",
    }
  });

  // 4. SEED CATEGORIES
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Mobile Games", slug: "mobile-games", sortOrder: 1 } }),
    prisma.category.create({ data: { name: "PC Games", slug: "pc-games", sortOrder: 2 } }),
    prisma.category.create({ data: { name: "Vouchers", slug: "vouchers", sortOrder: 3 } }),
  ]);

  // 5. SEED GAMES (Daftar Game Populer Internasional)
  const gamesData = [
    { name: "Mobile Legends", slug: "mlbb", catIdx: 0, publisher: "Moonton", hasServer: true },
    { name: "Free Fire", slug: "ff", catIdx: 0, publisher: "Garena", hasServer: false },
    { name: "Genshin Impact", slug: "genshin", catIdx: 0, publisher: "Hoyoverse", hasServer: true },
    { name: "Valorant", slug: "valo", catIdx: 1, publisher: "Riot Games", hasServer: false },
    { name: "Honkai: Star Rail", slug: "hsr", catIdx: 0, publisher: "Hoyoverse", hasServer: true },
    { name: "Steam Wallet IDR", slug: "steam", catIdx: 2, publisher: "Valve", hasServer: false },
  ];

  console.log("🎮 Menanam benih game dan ribuan variasi produk...");

  for (const g of gamesData) {
    const game = await prisma.game.create({
      data: {
        name: g.name,
        slug: g.slug,
        categoryId: categories[g.catIdx].id,
        publisher: g.publisher,
        hasServerId: g.hasServer,
        isHot: true,
      }
    });

    // MEGA GENERATOR: 200 Produk per Game (Total 1200+ produk untuk awal)
    // Kita gunakan looping agar produk terlihat melimpah layaknya toko maturity
    for (let i = 1; i <= 200; i++) {
      const amount = i * 10; 
      const priceModal = amount * 200; // Logika harga modal palsu

      await prisma.product.create({
        data: {
          gameId: game.id,
          providerId: providers[0].id,
          sku: `${g.slug.toUpperCase()}-${amount}`,
          name: `${amount * 5} Diamonds / Credits`,
          priceModal: priceModal,
          priceMember: priceModal * 1.15,   // Margin 15%
          priceReseller: priceModal * 1.08, // Margin 8%
          priceVip: priceModal * 1.04,      // Margin 4%
          originalPrice: priceModal * 1.30, // Harga Coret
          isActive: true,
        }
      });
    }
  }

  // 6. SEED PAYMENT METHODS (Standard Enterprise)
  const payments = [
    { code: "QRIS", name: "QRIS All Payment", type: PaymentType.QRIS, feeFlat: 0, feePercent: 0.7 },
    { code: "BCAVA", name: "BCA Virtual Account", type: PaymentType.VIRTUAL_ACCOUNT, feeFlat: 4500, feePercent: 0 },
    { code: "MANDIRIVA", name: "Mandiri VA", type: PaymentType.VIRTUAL_ACCOUNT, feeFlat: 4500, feePercent: 0 },
    { code: "GOPAY", name: "GoPay", type: PaymentType.EWALLET, feeFlat: 1000, feePercent: 2 },
    { code: "ALFAMART", name: "Alfamart / Alfamidi", type: PaymentType.RETAIL, feeFlat: 5000, feePercent: 0 },
  ];

  for (const pm of payments) {
    await prisma.paymentMethod.create({ data: pm });
  }

  // 7. SEED PROMO (Gaya Tiket Elite)
  await prisma.promo.create({
    data: {
      code: "SULTANAPRIL",
      title: "Ramadan Sultan Cashback",
      description: "Diskon 10% khusus untuk member VIP.",
      type: PromoType.PERCENTAGE,
      value: 10,
      maxDiscount: 25000,
      minTransaction: 100000,
      startDate: new Date(),
      endDate: new Date("2026-12-31"),
      isActive: true,
    }
  });

  console.log("✅ SEEDING SELESAI! Empayar SassyGurlStore kini penuh dengan aset berharga.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });