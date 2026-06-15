# SassyGurl Premium Checkout & Data Overhaul

Sesuai permintaan untuk membuat SassyGurl Store 100% premium setara dengan Ditusi, perubahan besar ini akan diimplementasikan.

## User Review Required

> [!WARNING]
> Karena kita fokus pada versi Demo, saya akan men-generate produk mock yang 100% sama dengan tata letak Ditusi (termasuk kategori seperti "Weekly Pass", "Crystals") agar desain UI benar-benar hidup. Produk dari VIP Reseller akan tetap ada di sistem, tapi untuk keperluan demo, visualisasi akan sangat terbantu dengan Mock Data ini. Apakah Anda setuju dengan pendekatan ini?

## Open Questions

1. Apakah animasi *hover* (GIF/video) ingin menggunakan aset statis yang saya siapkan, atau Anda memiliki link aset sendiri?
2. Untuk integrasi WhatsApp, apakah hanya sekadar form input yang nantinya disimpan di database, atau harus langsung redirect ke aplikasi WhatsApp dengan pesan pre-filled?

## Proposed Changes

---

### Backend (Database & API)

#### [MODIFY] `SassyGurl.Api/Models/Entities.cs`
- Menambahkan kolom `TotalSold`, `AverageRating`, dan `TotalReviews` pada entitas `Game`.
- Kolom ini akan disajikan ke frontend sebagai "Live Social Proof".

#### [MODIFY] `SassyGurl.Api/Services/SyncEngine.cs`
- Menerapkan **Dynamic Margin Pricing**:
  - Harga < Rp50.000: Margin 2% (Lebih murah/kompetitif).
  - Harga Rp50.000 - Rp200.000: Margin 5%.
  - Harga Rp200.000 - Rp500.000: Margin 10%.
  - Harga > Rp500.000: Margin 15% (Sesuai permintaan untuk profit maksimal pada item mahal/jumlah besar).

#### [MODIFY] `SassyGurl.Api/Controllers/AdminCatalogController.cs`
- Menambahkan fitur/endpoint untuk men-generate Mock Products & Categories khusus untuk game demo (Genshin, MLBB, Free Fire) agar susunannya 100% persis seperti Ditusi.

---

### Frontend (UI/UX Premium)

#### [MODIFY] `app/games/[slug]/page.tsx`
- Mengubah struktur layout sepenuhnya menjadi **Single Page Checkout**.

#### [MODIFY] `app/games/[slug]/CheckoutClient.tsx`
- **Hero Banner Area**: Menambahkan banner sangat lebar (*wide banner*) di atas dengan efek gradient dan animasi interaktif saat kursor diarahkan ke logo/banner.
- **Live Social Proof**: Menampilkan "⭐️ 4.9 (58.6rb Ulasan) | 82.5rb Terjual" untuk membangun trust.
- **Item Categorization**: Produk tidak lagi berjejer rata, melainkan dikelompokkan (misal: "Special Items", "Crystals") seperti kotak-kotak kartu interaktif.
- **WhatsApp Field**: Menambahkan input Nomor WhatsApp di bawah form Email pada saat checkout.

## Verification Plan

### Automated Tests
- Menjalankan `dotnet ef migrations add PremiumCheckout` dan `dotnet ef database update`.
- Memastikan API `SyncEngine` menghitung persentase margin yang baru tanpa error.

### Manual Verification
- Navigasi ke halaman produk (contoh: Genshin Impact) dan pastikan *Single Page Checkout* berfungsi lancar tanpa reload.
- Verifikasi input WhatsApp tersimpan di tabel `Transactions`.
- Verifikasi produk dikelompokkan dengan cantik layaknya ditusi.co.id.
