# Migration Plan: Next.js API/Prisma -> SassyGurl .NET API

## Tujuan

Menyelesaikan migrasi dari route API internal Next.js + Prisma ke backend terpisah `.NET` tanpa downtime pada alur utama: auth, katalog, checkout, tracking, dan dashboard.

## Scope

- Frontend `app/*` dan `components/*` tidak lagi memanggil `/api/*` legacy.
- Semua data access dipindahkan ke `app/actions/*` dan `lib/api-client.ts`.
- Backend `.NET` menyediakan endpoint padanan untuk kebutuhan halaman existing.
- Dokumentasi dan keamanan konfigurasi deployment diselaraskan.

## Status Saat Ini

### Sudah tersedia

- Adapter client API:
  - `lib/api-client.ts`
  - `lib/api-adapter.ts`
- Server actions baru:
  - `app/actions/auth.ts`
  - `app/actions/transaction.ts`
  - `app/actions/dashboard.ts`
  - `app/actions/marketing.ts`
  - `app/actions/track.ts`
- Backend controllers:
  - `backend/SassyGurl.Api/Controllers/AuthController.cs`
  - `backend/SassyGurl.Api/Controllers/CatalogController.cs`
  - `backend/SassyGurl.Api/Controllers/DashboardController.cs`
  - `backend/SassyGurl.Api/Controllers/TransactionsController.cs`
  - `backend/SassyGurl.Api/Controllers/PromosController.cs`
  - `backend/SassyGurl.Api/Controllers/TrackController.cs`
  - `backend/SassyGurl.Api/Controllers/PaymentController.cs`

### Gap yang masih ada

- Halaman masih memanggil endpoint Next API yang sudah dihapus:
  - `app/auth/register/page.tsx` -> `/api/auth/register`
  - `app/admin/login/page.tsx` -> `/api/auth/login`
  - `app/cek-pesanan/page.tsx` -> `/api/cek-pesanan`
  - (Selesai) `app/member/page.tsx` telah dipindah ke server action (`getCurrentMemberAction`, `logoutAction`)
  - `app/components/StoreFront.tsx` -> `/api/checkout`
  - `app/components/CheckoutForm.tsx` -> `/api/checkout`
- Endpoint padanan member:
  - `/api/member/me` -> `/api/auth/me` (tersedia)
  - `/api/member/auth` -> `logoutAction` (hapus cookie `auth_token` di frontend server action)
- (Selesai) README telah diperbarui sesuai arsitektur Next.js + .NET API.
- (Selesai) secret sensitif telah dipindah ke env references (`.env.example`).
- (Selesai) EF baseline migration sudah tersedia di `backend/SassyGurl.Api/Migrations`.

## Mapping Endpoint Lama ke Endpoint Baru

| Legacy Next API | Target .NET API | Status |
|---|---|---|
| `/api/auth/login` | `/api/auth/login` | Tersedia di action, masih dipakai langsung di halaman lama |
| `/api/auth/register` | `/api/auth/register` | Tersedia di action, masih dipakai langsung di halaman lama |
| `/api/auth/2fa` | `/api/auth/verify-otp` | Sudah di action baru |
| `/api/catalog` | `/api/catalog/*` | Sudah via adapter |
| `/api/products` | `/api/catalog/games/{slug}` (perlu validasi kontrak) | Perlu verifikasi |
| `/api/checkout` | `/api/transactions` + `/api/payment/*` | Perlu refactor caller lama |
| `/api/cek-pesanan` | `/api/track/{invoice}` | Perlu refactor caller lama |
| `/api/member/me` | `/api/auth/me` | Selesai |
| `/api/member/auth` | `logoutAction` (clear auth cookie) | Selesai |
| Midtrans webhook (tanpa verifikasi) | `/api/payment/webhook` + signature/amount/replay validation | Selesai |

## Rencana Eksekusi Bertahap

## Fase 1 - Stop 404 di Frontend (Prioritas Tertinggi)

Tujuan: tidak ada lagi `fetch("/api/...")` ke route legacy yang sudah dihapus.

Checklist:
- [x] Refactor `app/auth/register/page.tsx` ke `app/actions/auth.ts` (register via backend API).
- [x] Refactor `app/admin/login/page.tsx` dari route Next legacy ke backend API langsung.
- [x] Refactor `app/cek-pesanan/page.tsx` ke action tracking (`app/actions/track.ts`).
- [x] Refactor `app/components/StoreFront.tsx` dari `/api/checkout` ke action transaksi.
- [x] Refactor `app/components/CheckoutForm.tsx` dari `/api/checkout` ke action transaksi/payment.

Definition of Done:
- Pencarian codebase tidak menemukan pemanggilan endpoint legacy kritikal.
- Halaman login/register/checkout/track berjalan tanpa 404.

## Fase 2 - Tutup Endpoint Gap Member

Tujuan: mengganti seluruh dependensi `/api/member/*`.

Checklist:
- [x] Tetapkan endpoint profil member ke `GET /api/auth/me`.
- [x] Implement logout via `logoutAction` (clear `auth_token` cookie).
- [x] Refactor `app/member/page.tsx` agar pakai action baru.
- [x] Samakan payload minimum DTO member (`userId`, `name`, `role`) untuk kebutuhan UI member.

Definition of Done:
- Tidak ada lagi referensi runtime ke `/api/member/me` dan `/api/member/auth` di code `app/*`.

## Fase 3 - Hardening Backend & Deploy

Tujuan: siap staging/production.

Checklist:
- [x] Pindahkan credential sensitif keluar dari `appsettings.json` (pakai env + `.env.example` untuk referensi).
- [x] Tambahkan dan commit EF migrations baseline (`backend/SassyGurl.Api/Migrations`).
- [x] Tambahkan healthcheck endpoint (`GET /health`) dan verifikasi startup.
- [~] Finalisasi TODO di layanan payment/transaction yang masih simulasi (webhook security selesai, fulfillment provider masih TODO bisnis).
- [x] Hardening global exception response: production tidak mengekspos detail exception, hanya trace id.
- [x] Hardening webhook: validasi signature Midtrans + amount check + replay-safe untuk terminal state.
- [x] Tambah rate-limiter untuk endpoint sensitif (`auth/*` dan `payment/webhook`).
- [x] Tambah `IHttpClientFactory` + Polly (retry/circuit-breaker/timeout) untuk klien provider eksternal.

Definition of Done:
- Konfigurasi sensitif tidak ada di source code.
- DB schema bisa direplikasi dari migrasi.

## Fase 4 - Dokumentasi & Cutover

Tujuan: tim punya panduan migrasi yang bisa diulang.

Checklist:
- [x] Update `README.md` sesuai arsitektur baru.
- [ ] Tambahkan "Endpoint Migration Matrix" final.
- [ ] Tambahkan runbook rollback sederhana (fallback endpoint, env switch).
- [ ] Tambahkan test checklist smoke test (auth, checkout, track, dashboard).
- [x] Tambah backend unit tests baseline (`MidtransWebhookSecurityTests`).
- [x] Tambah CI quality gate (`.github/workflows/quality-gates.yml`) untuk build/test + policy checks.

Definition of Done:
- Dokumen onboarding tidak lagi menyebut Prisma route lama.
- Cutover plan dan rollback plan tersedia.

## Test Plan Minimum Setelah Refactor

- Auth member:
  - Register -> login -> verify OTP.
- Checkout:
  - Pilih game -> submit transaksi -> dapat payment token/redirect.
- Tracking:
  - Cek invoice valid dan invalid.
- Dashboard:
  - Member summary dan admin summary endpoint merespon.

## Risiko dan Mitigasi

- Risiko mismatch DTO frontend-backend.
  - Mitigasi: kontrak DTO dibakukan + test integrasi endpoint utama.
- Risiko secret bocor dari source control.
  - Mitigasi: rotasi credential dan pindahkan ke env segera.
- Risiko regresi halaman legacy.
  - Mitigasi: refactor bertahap per halaman + smoke test per fase.
