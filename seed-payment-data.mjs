import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5432/sassygurl";
const client = new Client({ connectionString });

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE GAME CATALOG — Matches public/images/games/ assets
// ═══════════════════════════════════════════════════════════════════════════════
const GAMES = [
  { name: "Mobile Legends",       slug: "mlbb",          icon: "/images/games/mlbb_icon.jpeg",      banner: "/images/hero/hero_anime_duo_action.webp",        hasServerId: true,  isHot: true,  sort: 1  },
  { name: "Free Fire",            slug: "ff",            icon: "/images/games/ff_icon.jpeg",         banner: "/images/hero/hero_topup_bundle_03.jpg",          hasServerId: false, isHot: true,  sort: 2  },
  { name: "Genshin Impact",       slug: "genshin",       icon: "/images/games/gi_icon.jpeg",         banner: "/images/hero/hero_genshin_fantasy_battle.webp",  hasServerId: false, isHot: true,  sort: 3  },
  { name: "Honkai: Star Rail",    slug: "hsr",           icon: "/images/games/hsr_icon.webp",        banner: "/images/hero/hero_sci_fi_team_banner.webp",      hasServerId: false, isHot: true,  sort: 4  },
  { name: "Zenless Zone Zero",    slug: "zzz",           icon: "/images/games/zzz_icon.webp",        banner: "/images/hero/hero_anime_duo_action.webp",        hasServerId: false, isHot: true,  sort: 5  },
  { name: "Wuthering Waves",      slug: "wuwa",          icon: "/images/games/wuwa_icon.webp",       banner: "/images/hero/hero_genshin_fantasy_battle.webp",  hasServerId: false, isHot: false, sort: 6  },
  { name: "PUBG Mobile",          slug: "pubg",          icon: "/images/games/pubg_icon.svg",        banner: "/images/hero/hero_topup_bundle_03.jpg",          hasServerId: true,  isHot: false, sort: 7  },
  { name: "Valorant",             slug: "valorant",      icon: "/images/games/valorant_icon.jpeg",   banner: "/images/hero/hero_sci_fi_team_banner.webp",      hasServerId: false, isHot: false, sort: 8  },
  { name: "Honor of Kings",       slug: "hok",           icon: "/images/games/hok_icon.jpeg",        banner: "/images/hero/hero_anime_duo_action.webp",        hasServerId: false, isHot: false, sort: 9  },
  { name: "NIKKE",                slug: "nikke",         icon: "/images/games/nikke_icon.jpeg",      banner: "/images/hero/hero_sci_fi_team_banner.webp",      hasServerId: false, isHot: false, sort: 10 },
  { name: "League of Legends",    slug: "lol",           icon: "/images/games/lol_icon.jpeg",        banner: "/images/hero/hero_topup_bundle_03.jpg",          hasServerId: false, isHot: false, sort: 11 },
  { name: "LoL: Wild Rift",       slug: "lolwr",         icon: "/images/games/lolwr_icon.jpeg",      banner: "/images/hero/hero_anime_duo_action.webp",        hasServerId: false, isHot: false, sort: 12 },
  { name: "Roblox",               slug: "roblox",        icon: "/images/games/rbx_icon.png",         banner: "/images/hero/hero_topup_bundle_03.jpg",          hasServerId: false, isHot: false, sort: 13 },
  { name: "Aether Gazer",         slug: "akef",          icon: "/images/games/akef_icon.jpeg",       banner: "/images/hero/hero_genshin_fantasy_battle.webp",  hasServerId: false, isHot: false, sort: 14 },
  { name: "Magic Chess",          slug: "mccg",          icon: "/images/games/mccg_icon.jpeg",       banner: "/images/hero/hero_anime_duo_action.webp",        hasServerId: true,  isHot: false, sort: 15 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS — Matching backend PaymentType enum
// ═══════════════════════════════════════════════════════════════════════════════
const PAYMENT_METHODS = [
  { code: "QRIS",        name: "QRIS All Payment",       type: "QRIS",            logo: "/images/ui/payment-qris.svg",    feeFlat: 0,    feePercent: 0.7, sort: 1  },
  { code: "DANA",        name: "DANA",                   type: "EWALLET",         logo: "/images/ui/payment-dana.svg",    feeFlat: 1000, feePercent: 1.5, sort: 10 },
  { code: "OVO",         name: "OVO",                    type: "EWALLET",         logo: "/images/ui/payment-gopay.svg",   feeFlat: 1000, feePercent: 1.5, sort: 11 },
  { code: "GOPAY",       name: "GoPay",                  type: "EWALLET",         logo: "/images/ui/payment-gopay.svg",   feeFlat: 1000, feePercent: 1.5, sort: 12 },
  { code: "BCA_VA",      name: "BCA Virtual Account",    type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-bca.svg",     feeFlat: 4000, feePercent: 0,   sort: 20 },
  { code: "MANDIRI_VA",  name: "Mandiri Virtual Account", type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-mandiri.svg", feeFlat: 4000, feePercent: 0,   sort: 21 },
  { code: "BNI_VA",      name: "BNI Virtual Account",    type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-mandiri.svg", feeFlat: 4000, feePercent: 0,   sort: 22 },
  { code: "BRI_VA",      name: "BRI Virtual Account",    type: "VIRTUAL_ACCOUNT", logo: "/images/ui/payment-mandiri.svg", feeFlat: 4000, feePercent: 0,   sort: 23 },
  { code: "INDOMARET",   name: "Indomaret",              type: "RETAIL",          logo: "/images/ui/payment-retail.svg",  feeFlat: 5000, feePercent: 0,   sort: 30 },
  { code: "ALFAMART",    name: "Alfamart",               type: "RETAIL",          logo: "/images/ui/payment-retail.svg",  feeFlat: 5000, feePercent: 0,   sort: 31 },
];

async function seed() {
  try {
    console.log("🚀 SassyGurl Store — Production Seed v2.0");
    console.log("═".repeat(60));
    await client.connect();

    // ─── A. CATEGORY (single default) ─────────────────────────────────────
    console.log("\n📂 Seeding Category...");
    const catId = crypto.randomUUID();
    await client.query(`
      INSERT INTO "Category" (id, name, slug, "sortOrder")
      VALUES ($1, 'Game', 'game', 1)
      ON CONFLICT (slug) DO NOTHING;
    `, [catId]);

    // Get actual category id
    const catResult = await client.query(`SELECT id FROM "Category" WHERE slug = 'game' LIMIT 1`);
    const categoryId = catResult.rows[0]?.id || catId;
    console.log("   ✅ Category: Game");

    // ─── B. GAMES ─────────────────────────────────────────────────────────
    console.log("\n🎮 Seeding Games...");
    for (const g of GAMES) {
      await client.query(`
        INSERT INTO "Game" (id, "categoryId", name, slug, thumbnail, banner, "hasServerId", "isActive", "isHot", "sortOrder")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
        ON CONFLICT (slug) 
        DO UPDATE SET 
          name = EXCLUDED.name, 
          thumbnail = EXCLUDED.thumbnail, 
          banner = EXCLUDED.banner, 
          "hasServerId" = EXCLUDED."hasServerId",
          "isHot" = EXCLUDED."isHot",
          "sortOrder" = EXCLUDED."sortOrder";
      `, [crypto.randomUUID(), categoryId, g.name, g.slug, g.icon, g.banner, g.hasServerId, g.isHot, g.sort]);
      console.log(`   ✅ ${g.name} (${g.slug})`);
    }

    // ─── C. PAYMENT METHODS ───────────────────────────────────────────────
    console.log("\n💳 Seeding Payment Methods...");
    for (const pm of PAYMENT_METHODS) {
      await client.query(`
        INSERT INTO "PaymentMethod" (id, code, name, type, logo, "feeFlat", "feePercent", "isActive", "sortOrder")
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
        ON CONFLICT (code) 
        DO UPDATE SET 
          name = EXCLUDED.name, type = EXCLUDED.type, logo = EXCLUDED.logo,
          "feeFlat" = EXCLUDED."feeFlat", "feePercent" = EXCLUDED."feePercent",
          "sortOrder" = EXCLUDED."sortOrder";
      `, [crypto.randomUUID(), pm.code, pm.name, pm.type, pm.logo, pm.feeFlat, pm.feePercent, pm.sort]);
      console.log(`   ✅ ${pm.name} (${pm.code})`);
    }

    // ─── D. PROVIDERS ─────────────────────────────────────────────────────
    console.log("\n🔌 Seeding Providers...");
    for (const name of ["Digiflazz", "VipReseller"]) {
      await client.query(`
        INSERT INTO "Provider" (id, name, balance, "isActive", "successRate", "avgLatencyMs")
        VALUES ($1, $2, 0, true, 100, 0)
        ON CONFLICT (name) DO UPDATE SET "isActive" = true;
      `, [crypto.randomUUID(), name]);
      console.log(`   ✅ ${name}`);
    }

    // ─── E. ADMIN USER ────────────────────────────────────────────────────
    console.log("\n👤 Seeding Admin User...");
    const hash = bcrypt.hashSync("admin123", 10);
    await client.query(`
      INSERT INTO "User" (
        id, name, email, password, role, "isVerified", "kycStatus",
        "isTwoFactorEnable", balance, points, "referralCode", "totalCommission", version,
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, true, $6, false, 0, 0, $7, 0, $8, NOW(), NOW())
      ON CONFLICT (email) 
      DO UPDATE SET role = EXCLUDED.role, password = EXCLUDED.password;
    `, [
      crypto.randomUUID(), "SassyGurl Admin", "admin@sassygurl.id", hash,
      "SUPERADMIN", "VERIFIED",
      `ADMIN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      crypto.randomUUID()
    ]);
    console.log("   ✅ admin@sassygurl.id (SUPERADMIN)");

    console.log("\n" + "═".repeat(60));
    console.log("✨ 🎉 ALL SEED DATA UPSERTED SUCCESSFULLY!");
    console.log(`   📊 ${GAMES.length} Games | ${PAYMENT_METHODS.length} Payments | 2 Providers`);
    console.log("═".repeat(60));
  } catch (err) {
    console.error("\n❌ SEED FAILED:", err);
  } finally {
    await client.end();
    console.log("🔌 Connection closed.");
  }
}

seed();
