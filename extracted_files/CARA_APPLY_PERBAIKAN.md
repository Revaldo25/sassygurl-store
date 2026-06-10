# 📦 Cara Apply Semua Perbaikan ke Repository SassyGurl Store

## Isi Paket Ini

| File | Tujuan | Lokasi di Repo |
|------|--------|----------------|
| `invoice_page.tsx` | Fix port 5009 + gunakan Server Action | `app/invoice/[invoiceId]/page.tsx` |
| `CheckoutClient.tsx` | Ganti fetch() dengan Server Action | `app/games/[slug]/CheckoutClient.tsx` |
| `transaction_action.ts` | Update action + idempotency key | `app/actions/transaction.ts` |
| `dashboard_action.ts` | Tambah getReviewQueueAction + resolveProductAction | `app/actions/dashboard.ts` |
| `ReviewQueueClient.tsx` | Rewrite — pakai Server Actions, bukan /api/* | `app/admin/review/ReviewQueueClient.tsx` |
| `TransactionsController.cs` | Tambah [Authorize] | `backend/SassyGurl.Api/Controllers/TransactionsController.cs` |
| `XenditWebhookSecurityFilter.cs` | Fix timing attack (constant-time compare) | `backend/SassyGurl.Api/Filters/XenditWebhookSecurityFilter.cs` |
| `next.config.ts` | Hapus ngrok di production, perketat image domain | `next.config.ts` |
| `Dockerfile` | Tambah curl untuk health check | `backend/Dockerfile` |
| `vercel.json` | Konfigurasi deployment Vercel | `vercel.json` (baru) |
| `quality-gates.yml` | CI lengkap: frontend build + policy gates | `.github/workflows/quality-gates.yml` |
| `package.json` | Hapus 9 paket orphan legacy | `package.json` |
| `FULL.patch` | Git patch untuk apply sekaligus | — |

---

## Cara Apply: Opsi A — Manual (Lebih Aman)

Copy setiap file ke lokasi yang sesuai di repo kamu. Contoh:

```bash
# Di root folder repo kamu
cp ~/Downloads/invoice_page.tsx         app/invoice/\[invoiceId\]/page.tsx
cp ~/Downloads/CheckoutClient.tsx       app/games/\[slug\]/CheckoutClient.tsx
cp ~/Downloads/transaction_action.ts    app/actions/transaction.ts
cp ~/Downloads/dashboard_action.ts      app/actions/dashboard.ts
cp ~/Downloads/ReviewQueueClient.tsx    app/admin/review/ReviewQueueClient.tsx
cp ~/Downloads/next.config.ts           next.config.ts
cp ~/Downloads/package.json             package.json
cp ~/Downloads/vercel.json              vercel.json
cp ~/Downloads/quality-gates.yml        .github/workflows/quality-gates.yml

# Backend files
cp ~/Downloads/TransactionsController.cs   backend/SassyGurl.Api/Controllers/TransactionsController.cs
cp ~/Downloads/XenditWebhookSecurityFilter.cs  backend/SassyGurl.Api/Filters/XenditWebhookSecurityFilter.cs
cp ~/Downloads/Dockerfile               backend/Dockerfile
```

---

## Cara Apply: Opsi B — Git Patch

```bash
# Di root folder repo kamu
git apply FULL.patch

# Jika ada konflik, cek file mana yang bermasalah
git apply --check FULL.patch
```

---

## Setelah Apply: Langkah Wajib

### 1. Install ulang dependencies (karena package.json berubah)
```bash
npm install
```

### 2. Test build frontend
```bash
npm run build
```

### 3. Test build backend
```bash
cd backend && dotnet build SassyGurl.Api/SassyGurl.Api.csproj -c Release
```

### 4. Commit semua perubahan
```bash
git add -A
git commit -m "fix: apply all critical bug fixes and security hardening

- Fix invoice page: use Server Action, remove port 5009 hardcode
- Fix checkout: replace direct fetch() with createTransaction Server Action
- Fix review queue: replace /api/* 404 with Server Actions
- Fix backend: add [Authorize] to CreateTransaction endpoint
- Fix backend: constant-time token comparison (timing attack prevention)
- Fix next.config.ts: remove ngrok header from production build
- Fix Dockerfile: add curl for health check
- Add vercel.json for Vercel deployment configuration
- Update CI: add frontend build + lint job, better policy gates
- Remove orphan legacy packages (drizzle-orm, mysql2, pg, etc.)"
```

### 5. Push dan verifikasi CI hijau
```bash
git push origin main
# Cek di GitHub Actions — semua job harus hijau
```

---

## Catatan Penting

- **Middleware** sudah diperbaiki di commit sebelumnya ✅
- **appsettings.Development.json** sudah bersih (PLACEHOLDER) ✅  
- **Social Login** sudah sync ke backend ✅
- Yang di-perbaiki di sini adalah 10 masalah yang MASIH tersisa

