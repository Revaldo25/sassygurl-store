/**
 * seed-payment-data.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 * Master Database Seeder — SassyGurl Store
 * 
 * Cara pakai:
 *   1. Pastikan .env ada di root (DATABASE_URL wajib diisi)
 *   2. node seed-payment-data.mjs
 *
 * Setiap run aman diulang — semua INSERT menggunakan ON CONFLICT DO UPDATE
 * ═══════════════════════════════════════════════════════════════════════════
 */
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:12345@localhost:5432/sassygurl";
const client = new Client({ connectionString });

// ═══════════════════════════════════════════════════════════════════════════
// GAME CATALOG — slug harus cocok dengan games_manifest.json & Provider SKU
// icon & banner → public/images/games/{slug}/
// ═══════════════════════════════════════════════════════════════════════════
const GAMES = [
  // ── Tier 1: Paling Populer & Paling Banyak Supply ──────────────────────
  {
    name: "Mobile Legends: Bang Bang", slug: "mlbb",
    icon: "/images/games/mlbb/icon.webp", banner: "/images/games/mlbb/banner.webp",
    currency: "Diamonds", hasServerId: true, isHot: true, isActive: true, sort: 1,
    publisher: "Moonton", desc: "Top up Diamond Mobile Legends termurah, teraman, dan terpercaya! Proses instan 1-3 detik."
  },
  {
    name: "Free Fire", slug: "ff",
    icon: "/images/games/ff/icon.webp", banner: "/images/games/ff/banner.webp",
    currency: "Diamonds", hasServerId: false, isHot: true, isActive: true, sort: 2,
    publisher: "Garena", desc: "Top up Diamond Free Fire (FF) dengan harga terbaik dan proses super cepat."
  },
  {
    name: "PUBG Mobile", slug: "pubg",
    icon: "/images/games/pubg/icon.png", banner: "/images/games/pubg/banner.webp",
    currency: "UC", hasServerId: true, isHot: true, isActive: true, sort: 3,
    publisher: "Krafton", desc: "Top up UC PUBG Mobile murah dan proses otomatis. Royale Pass tersedia!"
  },
  {
    name: "Genshin Impact", slug: "genshin",
    icon: "/images/games/genshin/icon.webp", banner: "/images/games/genshin/banner.webp",
    currency: "Genesis Crystals", hasServerId: false, isHot: true, isActive: true, sort: 4,
    publisher: "HoYoverse", desc: "Beli Genesis Crystals Genshin Impact murah, aman, dan instan. Welkin Moon juga tersedia!"
  },
  {
    name: "Honkai: Star Rail", slug: "hsr",
    icon: "/images/games/hsr/icon.webp", banner: "/images/games/hsr/banner.webp",
    currency: "Oneiric Shards", hasServerId: false, isHot: true, isActive: true, sort: 5,
    publisher: "HoYoverse", desc: "Top up Oneiric Shards Honkai Star Rail dengan harga termurah dan proses instan."
  },
  {
    name: "Zenless Zone Zero", slug: "zzz",
    icon: "/images/games/zzz/icon.webp", banner: "/images/games/zzz/banner.webp",
    currency: "Monochrome", hasServerId: false, isHot: true, isActive: true, sort: 6,
    publisher: "HoYoverse", desc: "Beli Monochromes Zenless Zone Zero murah. Inter-Knot Membership tersedia!"
  },
  // ── Tier 2: Populer ─────────────────────────────────────────────────────
  {
    name: "Honor of Kings", slug: "hok",
    icon: "/images/games/hok/icon.webp", banner: "/images/games/hok/banner.webp",
    currency: "Tokens", hasServerId: false, isHot: false, isActive: true, sort: 7,
    publisher: "Level Infinite", desc: "Top up Tokens Honor of Kings murah dan cepat."
  },
  {
    name: "Valorant", slug: "valorant",
    icon: "/images/games/valorant/icon.png", banner: "/images/games/valorant/banner.webp",
    currency: "VP", hasServerId: false, isHot: false, isActive: true, sort: 8,
    publisher: "Riot Games", desc: "Beli Valorant Points (VP) murah untuk beli skins terbaru."
  },
  {
    name: "Wuthering Waves", slug: "wuwa",
    icon: "/images/games/wuwa/icon.webp", banner: "/images/games/wuwa/banner.webp",
    currency: "Lunite", hasServerId: false, isHot: false, isActive: true, sort: 9,
    publisher: "Kuro Games", desc: "Top up Lunite Wuthering Waves murah. Lunite Subscription tersedia!"
  },
  {
    name: "NIKKE: Goddess of Victory", slug: "nikke",
    icon: "/images/games/nikke/icon.webp", banner: "/images/games/nikke/banner.webp",
    currency: "Gems", hasServerId: false, isHot: false, isActive: true, sort: 10,
    publisher: "Level Infinite", desc: "Top up NIKKE Goddess of Victory dengan harga terbaik."
  },
  // ── Tier 3: Niche / Seasonal ─────────────────────────────────────────────
  {
    name: "Roblox", slug: "roblox",
    icon: "/images/games/roblox/icon.png", banner: "/images/games/roblox/banner.webp",
    currency: "Robux", hasServerId: false, isHot: false, isActive: true, sort: 11,
    publisher: "Roblox Corporation", desc: "Beli Robux murah untuk beli item di Roblox. Proses otomatis!"
  },
  {
    name: "Steam Wallet", slug: "steam-wallet",
    icon: "/images/games/steam-wallet/icon.png", banner: "/images/games/steam-wallet/banner.webp",
    currency: "USD", hasServerId: false, isHot: false, isActive: true, sort: 12,
    publisher: "Valve", desc: "Isi Steam Wallet murah. Beli game favoritmu dengan harga terbaik."
  },
  {
    name: "League of Legends", slug: "lol",
    icon: "/images/games/lol/icon.png", banner: "/images/games/lol/banner.webp",
    currency: "Riot Points", hasServerId: false, isHot: false, isActive: true, sort: 13,
    publisher: "Riot Games", desc: "Beli Riot Points League of Legends murah. Beli skin baru sekarang!"
  },
  {
    name: "LoL: Wild Rift", slug: "lolwr",
    icon: "/images/games/lolwr/icon.webp", banner: "/images/games/lolwr/banner.webp",
    currency: "Wild Cores", hasServerId: false, isHot: false, isActive: true, sort: 14,
    publisher: "Riot Games", desc: "Top up Wild Cores LoL Wild Rift murah dan cepat."
  },
  {
    name: "Magic Chess: Go Go", slug: "mccg",
    icon: "/images/games/mccg/icon.webp", banner: "/images/games/mccg/banner.webp",
    currency: "Diamonds", hasServerId: true, isHot: false, isActive: true, sort: 15,
    publisher: "Moonton", desc: "Top up Diamond Magic Chess Go Go murah. Server ID diperlukan."
  },
  {
    name: "EA FC Mobile", slug: "fc-mobile",
    icon: "/images/games/fc-mobile/icon.webp", banner: "/images/games/fc-mobile/banner.webp",
    currency: "FC Coins", hasServerId: false, isHot: false, isActive: true, sort: 16,
    publisher: "Electronic Arts", desc: "Beli FC Coins EA FC Mobile murah. Main sepakbola lebih seru!"
  },
  {
    name: "Arknights: Endfield", slug: "arknights-endfield",
    icon: "/images/games/arknights-endfield/icon.webp", banner: "/images/games/arknights-endfield/banner.webp",
    currency: "Ingots", hasServerId: false, isHot: false, isActive: true, sort: 17,
    publisher: "HyperGryph", desc: "Top up Arknights Endfield murah. Proses otomatis dan aman."
  },
  {
    name: "Delta Force", slug: "delta-force",
    icon: "/images/games/delta-force/icon.webp", banner: "/images/games/delta-force/banner.webp",
    currency: "Coins", hasServerId: false, isHot: false, isActive: true, sort: 18,
    publisher: "TiMi Studio", desc: "Beli item Delta Force murah dan cepat."
  },
  {
    name: "Blood Strike", slug: "blood-strike",
    icon: "/images/games/blood-strike/icon.webp", banner: "/images/games/blood-strike/banner.webp",
    currency: "Gems", hasServerId: false, isHot: false, isActive: true, sort: 19,
    publisher: "NetEase", desc: "Top up Blood Strike murah. Item dan skin terbaru tersedia!"
  },
  {
    name: "Aether Gazer", slug: "aether-gazer",
    icon: "/images/games/aether-gazer/icon.webp", banner: "/images/games/aether-gazer/banner.webp",
    currency: "Futurits", hasServerId: false, isHot: false, isActive: true, sort: 20,
    publisher: "Yostar", desc: "Top up Aether Gazer murah. Futurits tersedia dengan harga terjangkau."
  },
  {
    name: "PUBG: New State", slug: "pubgm",
    icon: "/images/games/pubgm/icon.webp", banner: "/images/games/pubgm/banner.webp",
    currency: "NC", hasServerId: false, isHot: false, isActive: false, sort: 21,
    publisher: "Krafton", desc: "Top up PUBG New State murah. NC tersedia dengan proses otomatis."
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS — sesuai PaymentType enum .NET & ikon di public/images/ui/
// ═══════════════════════════════════════════════════════════════════════════
const PAYMENT_METHODS = [
  // QRIS
  { code: "QRIS",        name: "QRIS All Payment",        type: "QRIS",            logo: "/images/ui/payment-qris.svg",    feeFlat: 0,    feePercent: 0.70, sort: 1  },
  // E-Wallet
  { code: "DANA",        name: "DANA",                    type: "EWALLET",         logo: "/images/ui/payment-dana.svg",    feeFlat: 1000, feePercent: 1.50, sort: 10 },
  { code: "OVO",         name: "OVO",                     type: "EWALLET",         logo: "/images/ui/payment-ovo.svg",     feeFlat: 1000, feePercent: 1.50, sort: 11 },
  { code: "GOPAY",       name: "GoPay",                   type: "EWALLET",         logo: "/images/ui/payment-gopay.svg",   feeFlat: 1000, feePercent: 1.50, sort: 12 },
  { code: "SHOPEEPAY",   name: "ShopeePay",               type: "EWALLET",         logo: "/images/ui/payment-shopee.svg",  feeFlat: 1000, feePercent: 1.50, sort: 13 },
  // Virtual Account
  { code: "BCA_VA",      name: "BCA Virtual Account",     type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-bca.svg",     feeFlat: 4000, feePercent: 0,    sort: 20 },
  { code: "MANDIRI_VA",  name: "Mandiri Virtual Account", type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-mandiri.svg", feeFlat: 4000, feePercent: 0,    sort: 21 },
  { code: "BNI_VA",      name: "BNI Virtual Account",     type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-bni.svg",     feeFlat: 4000, feePercent: 0,    sort: 22 },
  { code: "BRI_VA",      name: "BRI Virtual Account",     type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-bri.svg",     feeFlat: 4000, feePercent: 0,    sort: 23 },
  { code: "PERMATA_VA",  name: "Permata Virtual Account", type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-mandiri.svg", feeFlat: 4000, feePercent: 0,    sort: 24 },
  // Retail
  { code: "INDOMARET",   name: "Indomaret",               type: "RETAIL",          logo: "/images/ui/payment-retail.svg",  feeFlat: 5000, feePercent: 0,    sort: 30 },
  { code: "ALFAMART",    name: "Alfamart",                type: "RETAIL",          logo: "/images/ui/payment-retail.svg",  feeFlat: 5000, feePercent: 0,    sort: 31 },
  // Wallet internal
  { code: "WALLET",      name: "SassyGurl Wallet",        type: "EWALLET",         logo: "/images/ui/logo-sassygurl.svg",  feeFlat: 0,    feePercent: 0,    sort: 99 },
];

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN USER
// ═══════════════════════════════════════════════════════════════════════════
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "admin@sassygurl.store";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "SassyGurl@2026!";
const ADMIN_NAME     = "SassyGurl Admin";

// ═══════════════════════════════════════════════════════════════════════════
// SEED RUNNER
// ═══════════════════════════════════════════════════════════════════════════
async function seed() {
  try {
    console.log("🌸 SassyGurl Store — Database Seeder v3.0");
    console.log("═".repeat(60));
    await client.connect();

    // ─── A. CATEGORY ──────────────────────────────────────────────────────
    console.log("\n📂  Seeding categories...");
    await client.query(`
      INSERT INTO "Category" (id, name, slug, "sortOrder")
      VALUES ($1, 'Game', 'game', 1)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
    `, [crypto.randomUUID()]);
    const catResult = await client.query(`SELECT id FROM "Category" WHERE slug = 'game' LIMIT 1`);
    const categoryId = catResult.rows[0].id;
    console.log(`    ✅ Category: game (id: ${categoryId})`);

    // ─── B. GAMES ─────────────────────────────────────────────────────────
    console.log("\n🎮  Seeding games...");
    let gAdded = 0, gUpdated = 0;
    for (const g of GAMES) {
      const res = await client.query(`
        INSERT INTO "Game" (
          id, "categoryId", name, slug, thumbnail, banner,
          "currencyName", "hasServerId", "isActive", "isHot", "sortOrder",
          publisher, "guideImage"
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NULL)
        ON CONFLICT (slug) DO UPDATE SET
          name           = EXCLUDED.name,
          thumbnail      = EXCLUDED.thumbnail,
          banner         = EXCLUDED.banner,
          "currencyName" = EXCLUDED."currencyName",
          "hasServerId"  = EXCLUDED."hasServerId",
          "isActive"     = EXCLUDED."isActive",
          "isHot"        = EXCLUDED."isHot",
          "sortOrder"    = EXCLUDED."sortOrder",
          publisher      = EXCLUDED.publisher
        RETURNING (xmax = 0) AS inserted;
      `, [
        crypto.randomUUID(), categoryId, g.name, g.slug,
        g.icon, g.banner, g.currency, g.hasServerId,
        g.isActive, g.isHot, g.sort, g.publisher
      ]);
      if (res.rows[0]?.inserted) gAdded++; else gUpdated++;
      const status = g.isActive ? "🟢" : "⚫";
      const hot = g.isHot ? " 🔥" : "";
      console.log(`    ${status} ${g.slug.padEnd(22)}${hot}`);
    }
    console.log(`    → ${gAdded} ditambah, ${gUpdated} diperbarui`);

    // ─── C. PAYMENT METHODS ───────────────────────────────────────────────
    console.log("\n💳  Seeding payment methods...");
    let pAdded = 0, pUpdated = 0;
    for (const p of PAYMENT_METHODS) {
      const res = await client.query(`
        INSERT INTO "PaymentMethod" (id, code, name, type, logo, "feeFlat", "feePercent", "isActive", "sortOrder")
        VALUES ($1,$2,$3,$4::\"PaymentType\",$5,$6,$7,true,$8)
        ON CONFLICT (code) DO UPDATE SET
          name        = EXCLUDED.name,
          logo        = EXCLUDED.logo,
          "feeFlat"   = EXCLUDED."feeFlat",
          "feePercent"= EXCLUDED."feePercent",
          "sortOrder" = EXCLUDED."sortOrder"
        RETURNING (xmax = 0) AS inserted;
      `, [crypto.randomUUID(), p.code, p.name, p.type, p.logo, p.feeFlat, p.feePercent, p.sort]);
      if (res.rows[0]?.inserted) pAdded++; else pUpdated++;
      console.log(`    ✅ ${p.code.padEnd(15)} → ${p.name}`);
    }
    console.log(`    → ${pAdded} ditambah, ${pUpdated} diperbarui`);

    // ─── D. ADMIN USER ────────────────────────────────────────────────────
    console.log("\n👤  Seeding admin user...");
    const existingAdmin = await client.query(
      `SELECT id FROM "User" WHERE email = $1`, [ADMIN_EMAIL]
    );
    if (existingAdmin.rows.length === 0) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await client.query(`
        INSERT INTO "User" (
          id, email, name, password, role, "kycStatus", "isVerified", 
          "referralCode", version, balance, points, "totalCommission", 
          "createdAt", "updatedAt", "isTwoFactorEnable"
        )
        VALUES (
          $1, $2, $3, $4, 'SUPERADMIN', 'VERIFIED', true, 
          $5, $6, 0, 0, 0, 
          NOW(), NOW(), false
        )
      `, [
        crypto.randomUUID(), ADMIN_EMAIL, ADMIN_NAME, hash, 
        crypto.randomUUID(), crypto.randomUUID()
      ]);
      console.log(`    ✅ Admin dibuat: ${ADMIN_EMAIL}`);
      console.log(`    ⚠️  Ganti password default setelah login pertama!`);
    } else {
      console.log(`    ℹ️  Admin sudah ada: ${ADMIN_EMAIL}`);
    }

    // ─── E. SYSTEM SETTINGS ───────────────────────────────────────────────
    console.log("\n⚙️   Seeding system settings...");
    const settings = [
      { key: "site_name",         value: "SassyGurl Store" },
      { key: "site_tagline",      value: "Top Up Gaming Termurah & Tercepat" },
      { key: "maintenance_mode",  value: "false" },
      { key: "min_topup_amount",  value: "10000" },
      { key: "max_topup_amount",  value: "5000000" },
      { key: "wa_notif_enabled",  value: "true" },
    ];
    for (const s of settings) {
      await client.query(`
        INSERT INTO "SystemSetting" (key, value, "updatedAt")
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW();
      `, [s.key, s.value]);
    }
    console.log(`    ✅ ${settings.length} settings diterapkan`);

    console.log("\n" + "═".repeat(60));
    console.log("✅  Seeding selesai!");
    console.log("\n📌  Langkah berikutnya:");
    console.log("   1. Buka admin panel → Sync katalog Digiflazz/VIP");
    console.log("   2. Verifikasi game muncul di homepage");
    console.log("   3. Test checkout MLBB atau FF");
    console.log("═".repeat(60));

  } catch (err) {
    console.error("\n❌  Seeding GAGAL:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
