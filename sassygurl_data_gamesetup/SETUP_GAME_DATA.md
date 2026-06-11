# 🎮 Panduan Lengkap: Setup Data Game & Aset SassyGurl Store

## 🗺️ Arsitektur Data — Bagaimana Semuanya Terhubung

```
┌─────────────────────────────────────────────────────────────────┐
│  SUMBER DATA (pilih berdasarkan kebutuhan)                      │
│                                                                  │
│  A. seed-payment-data.mjs   ──►  PostgreSQL DB                  │
│     (setup awal, sekali jalan)     ↓                            │
│                                                                  │
│  B. Digiflazz/VIP API       ──►  PostgreSQL DB                  │
│     (sync otomatis via admin        ↓                           │
│      panel atau cron)               ↓                           │
│                                                                  │
│  C. games_manifest.json     ──►  Frontend (STATIC)             │
│     (ikon, banner, accent color)    ↓                           │
│                                                                  │
│  D. real_catalog.ts         ──►  Frontend (FALLBACK)           │
│     (produk demo jika DB kosong)    ↓                           │
│                              api-adapter.ts                     │
│                                    ↓                            │
│                          Halaman Game (Next.js)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Aset Gambar

### Format Ikon & Banner Game
Semua game menggunakan struktur folder ini:
```
public/images/games/{slug}/
├── icon.webp        → Ikon bulat/kotak (256×256px minimum)
├── banner.webp      → Banner halaman game (1200×400px)
├── banner.avif      → Banner alternatif format AVIF (lebih kecil)
├── og.webp          → Open Graph untuk SEO (1200×630px)
└── og.avif          → OG format AVIF
```

### Game yang Sudah Lengkap (21 game ✅)
| Slug | Nama | Hot? | Server ID? |
|------|------|------|-----------|
| `mlbb` | Mobile Legends | 🔥 | ✅ (User ID + Zone ID) |
| `ff` | Free Fire | 🔥 | ❌ (User ID saja) |
| `pubg` | PUBG Mobile | 🔥 | ✅ |
| `genshin` | Genshin Impact | 🔥 | ❌ |
| `hsr` | Honkai: Star Rail | 🔥 | ❌ |
| `zzz` | Zenless Zone Zero | 🔥 | ❌ |
| `hok` | Honor of Kings | - | ❌ |
| `valorant` | Valorant | - | ❌ |
| `wuwa` | Wuthering Waves | - | ❌ |
| `nikke` | NIKKE | - | ❌ |
| `roblox` | Roblox | - | ❌ |
| `steam-wallet` | Steam Wallet | - | ❌ |
| `lol` | League of Legends | - | ❌ |
| `lolwr` | LoL: Wild Rift | - | ❌ |
| `mccg` | Magic Chess | - | ✅ |
| `fc-mobile` | EA FC Mobile | - | ❌ |
| `arknights-endfield` | Arknights: Endfield | - | ❌ |
| `delta-force` | Delta Force | - | ❌ |
| `blood-strike` | Blood Strike | - | ❌ |
| `aether-gazer` | Aether Gazer | - | ❌ |
| `pubgm` | PUBG: New State | - | ❌ |

### Ikon Metode Pembayaran
```
public/images/ui/
├── payment-qris.svg      → QRIS All Payment
├── payment-dana.svg      → DANA
├── payment-gopay.svg     → GoPay
├── payment-ovo.svg       → OVO ✅ (baru ditambahkan)
├── payment-shopee.svg    → ShopeePay ✅ (baru ditambahkan)
├── payment-bca.svg       → BCA Virtual Account
├── payment-mandiri.svg   → Mandiri Virtual Account
├── payment-bni.svg       → BNI Virtual Account ✅ (baru ditambahkan)
├── payment-bri.svg       → BRI Virtual Account ✅ (baru ditambahkan)
└── payment-retail.svg    → Indomaret & Alfamart
```

---

## 🚀 Langkah Setup Pertama Kali (Urutan Wajib)

### Step 1: Siapkan Database
```bash
# Jalankan migrasi .NET EF
cd backend
dotnet ef database update
```

### Step 2: Seed Data Master
```bash
# Dari root folder proyek
# Pastikan .env sudah ada dengan DATABASE_URL yang benar
node seed-payment-data.mjs
```

Output yang diharapkan:
```
🌸 SassyGurl Store — Database Seeder v3.0
═══════════════════════════════════════════
📂  Seeding categories... ✅
🎮  Seeding games...
    🟢 mlbb 🔥
    🟢 ff 🔥
    ... (21 game total)
    → 21 ditambah, 0 diperbarui
💳  Seeding payment methods...
    ✅ QRIS → QRIS All Payment
    ... (12 metode total)
👤  Seeding admin user...
    ✅ Admin dibuat: admin@sassygurl.store
⚙️   Seeding system settings...
    ✅ 6 settings diterapkan
═══════════════════════════════════════════
✅  Seeding selesai!
```

### Step 3: Jalankan Backend & Frontend
```bash
# Terminal 1: Backend
cd backend && dotnet run --project SassyGurl.Api

# Terminal 2: Frontend
npm run dev
```

### Step 4: Sync Produk dari Provider
1. Login ke admin panel: `http://localhost:3000/admin/login`
2. Buka menu **Catalog Management → Provider Sync**
3. Klik **Sync Digiflazz** → tunggu hingga selesai
4. Klik **Sync VIP Reseller** → tunggu hingga selesai
5. Cek **Review Queue** → approve produk yang perlu review

> **Catatan:** Sebelum sync, pastikan API key Digiflazz dan VIP Reseller
> sudah diisi di `.env` atau `appsettings.Development.json`

---

## 🔄 Alur Data Produk (Dari Provider ke Frontend)

```
Digiflazz API              VIP Reseller API
      │                           │
      └──────────┬────────────────┘
                 ▼
        ProviderSyncService.cs
        (Polly Circuit Breaker)
                 │
                 ▼
         GameMatcher.cs
    (cocokkan SKU provider ke game slug)
         alias: "Mobile Legends" → mlbb
                 │
                 ▼
         PostgreSQL DB
         Tabel: Products
         - sku, name, price
         - gameId (foreign key)
         - providerName
         - isActive, inStock
                 │
                 ▼
         GET /api/catalog/games/{slug}
                 │
                 ▼
         api-adapter.ts (frontend)
         ┌─────────────────────┐
         │ Merge dengan:       │
         │ • games_manifest    │ → ikon, banner, accent color
         │ • real_catalog.ts   │ → fallback jika DB kosong
         └─────────────────────┘
                 │
                 ▼
         Halaman /games/{slug}
```

---

## 🖼️ Cara Tambah Game Baru

### 1. Siapkan Aset Gambar
```bash
mkdir -p public/images/games/NAMA-SLUG-GAME

# Upload file berikut ke folder tersebut:
# icon.webp    (256×256px)
# banner.webp  (1200×400px)
# banner.avif  (optional, lebih kecil)
# og.webp      (1200×630px)
# og.avif      (optional)
```

### 2. Update `shared/registry/games_manifest.json`
```json
"nama-slug": {
  "accent": "#WARNA_HEX",
  "banner": "/images/games/nama-slug/banner.avif",
  "banner_fallback": "/images/games/nama-slug/banner.webp",
  "og": "/images/games/nama-slug/og.avif",
  "og_fallback": "/images/games/nama-slug/og.webp",
  "icon": "/images/games/nama-slug/icon.webp"
}
```

### 3. Update `shared/registry/games_registry.json`
Tambahkan entry baru dengan `slug`, `canonical_name`, `aliases`, dll.

### 4. Update `seed-payment-data.mjs`
Tambahkan entry baru di array `GAMES`:
```js
{
  name: "Nama Game Lengkap", slug: "nama-slug",
  icon: "/images/games/nama-slug/icon.webp",
  banner: "/images/games/nama-slug/banner.webp",
  currency: "Jenis Mata Uang",
  hasServerId: false, isHot: false, isActive: true, sort: 22,
  publisher: "Nama Publisher",
  desc: "Deskripsi singkat untuk halaman game."
},
```

### 5. Jalankan seed ulang
```bash
node seed-payment-data.mjs
```

### 6. (Optional) Tambahkan di `real_catalog.ts`
Untuk data produk demo sebelum provider sync:
```ts
"nama-slug": [
  { name: "60 Mata Uang",   price: 14000, originalPrice: 16000, type: "CODE" },
  ...
],
```

### 7. Sync provider
Di admin panel, jalankan sync ulang untuk game baru tersebut.

---

## 🔍 Troubleshooting

### Ikon game tidak muncul
1. Cek apakah file `public/images/games/{slug}/icon.webp` ada
2. Cek apakah slug di `games_manifest.json` sama persis dengan slug di database
3. Lihat console browser untuk error 404 pada gambar

### Game muncul tapi tidak ada produk
1. Belum sync dari provider → jalankan sync di admin panel
2. Produk belum di-approve dari review queue
3. Provider tidak mengenali game ini → cek `games_aliases.json`

### Metode pembayaran tidak tampil
1. Cek database: `SELECT code, "IsActive" FROM "PaymentMethod";`
2. Jika kosong → jalankan `node seed-payment-data.mjs` ulang
3. Cek log backend untuk error dari Midtrans/Xendit

### GameSeeder gagal dengan "Registry file not found"
Set environment variable:
```env
GameRegistry__Path=/path/absolut/ke/shared/registry/games_registry.json
```
Atau pastikan folder `shared/registry/` ada di sebelah folder `backend/`.

