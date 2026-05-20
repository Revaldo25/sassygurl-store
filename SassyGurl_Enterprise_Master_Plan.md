# SassyGurl Store — Master Plan Enterprise-Grade + AI Prompt Spec

> Dokumen ini adalah **sumber kebenaran tunggal** untuk pengembangan SassyGurl Store.  
> Tujuan utamanya: membuat sistem yang **stabil, dapat didemo, mudah dikembangkan, dan tidak mengandalkan asumsi liar AI**.

---

## 1) Tujuan Utama

Bangun platform top-up game yang:

- menampilkan katalog produk dari **database internal**, bukan langsung dari provider,
- sinkronisasi provider berjalan di **background worker**,
- transaksi memiliki status yang jelas dan aman,
- integrasi API tervalidasi dengan contract yang eksplisit,
- UI demo-ready dan tetap hidup walau provider gagal,
- siap dikembangkan menjadi sistem enterprise oleh developer lain tanpa bingung,
- semua perubahan bisa dipahami, diuji, dan diaudit.

---

## 2) Prinsip Kerja yang Tidak Boleh Dilanggar

### 2.1 Jangan mengarang
AI tidak boleh menebak:

- nama endpoint,
- struktur response,
- nama field database,
- format signature,
- alur transaksi,
- perilaku provider,
- aturan bisnis yang belum tertulis.

Kalau ada hal yang tidak jelas, AI harus:

1. menandai asumsi,
2. menjelaskan risiko,
3. meminta verifikasi,
4. atau menunda implementasi bagian itu.

### 2.2 Satu sumber kebenaran
Untuk setiap area, hanya boleh ada satu referensi utama:

- dokumentasi produk,
- dokumentasi arsitektur,
- kontrak API,
- skema database,
- state machine transaksi,
- strategi sync provider.

Jika ada dokumen lama yang bertentangan, dokumen ini menang.

### 2.3 Provider bukan sumber UI
Frontend tidak boleh membaca provider langsung untuk katalog utama.  
Alur yang benar:

`Provider API -> Raw Store -> Normalizer -> Catalog Publish -> Frontend`

### 2.4 Produk harus tetap tampil saat provider gagal
Kalau provider down, timeout, rate limit, atau response berubah:

- katalog tetap tampil dari last known good data,
- status provider ditandai bermasalah,
- sync bisa retry,
- UI jangan blank.

---

## 3) Gambaran Sistem Target

### Frontend
- Next.js App Router
- komponen presentasional
- data dari API internal
- loading state, empty state, error state yang rapi

### Backend
- ASP.NET Core API
- auth, catalog, transaction, provider sync, payment processing
- business logic dipusatkan di backend

### Database
- PostgreSQL
- transaksi dan audit trail disimpan rapi
- data provider mentah dipisah dari data publik

### Real-time
- SignalR untuk status order, sync, dan notifikasi dashboard

### Background Worker
- sync provider
- retry job
- cleanup job
- reconciliation job
- scheduled update

### Cache / Queue
- Redis untuk cache, rate limit, dan job coordination

---

## 4) Struktur Domain yang Disarankan

### 4.1 Catalog Domain
Entitas inti:

- `Category`
- `Game`
- `Product`
- `Provider`
- `ProviderRawProduct`
- `ProviderProductMap`
- `PricingRule`
- `CatalogPublishLog`

### 4.2 Transaction Domain
Entitas inti:

- `Order`
- `OrderItem`
- `Payment`
- `PaymentCallback`
- `TransactionLog`
- `OrderStatusHistory`
- `Refund`

### 4.3 User / Role Domain
Entitas inti:

- `User`
- `Role`
- `Permission`
- `Session` / `RefreshToken`
- `AuditLog`

### 4.4 Operations Domain
Entitas inti:

- `SyncJob`
- `SyncJobRun`
- `ProviderHealthSnapshot`
- `ErrorLog`
- `MetricSnapshot`

---

## 5) Arsitektur Data Provider yang Benar

### 5.1 Raw Layer
Semua response provider disimpan mentah.

Tujuan:
- debugging,
- audit,
- replay,
- validasi schema.

Contoh isi:
- payload request,
- response JSON,
- timestamp,
- provider name,
- status code,
- request duration,
- trace id.

### 5.2 Normalized Layer
Response provider diubah ke format internal yang stabil.

Contoh field stabil:
- `providerId`
- `providerSku`
- `gameSlug`
- `productName`
- `basePrice`
- `sellPrice`
- `status`
- `stockStatus`
- `region`
- `isActive`

### 5.3 Published Layer
Layer ini yang dipakai frontend.

Aturan:
- hanya data yang lolos validasi,
- hanya data yang aktif,
- harga sudah dihitung,
- mapping game sudah sah,
- hasil sync terakhir harus tercatat.

---

## 6) Aturan Khusus Integrasi Digiflazz

### 6.1 Prinsip umum
Digiflazz harus diperlakukan sebagai **provider eksternal yang tidak stabil**.  
Jangan pernah mengasumsikan:

- response selalu lengkap,
- urutan data selalu sama,
- brand selalu konsisten,
- field selalu ada,
- harga selalu langsung valid.

### 6.2 Kontrak yang harus diperiksa
- format request,
- mekanisme signature,
- endpoint pricelist,
- limit frekuensi sync,
- arti status response,
- aturan webhook / callback jika dipakai.

### 6.3 Data yang wajib disimpan untuk debugging
- request body,
- response body,
- HTTP status,
- duration,
- retry count,
- error message,
- raw brand / category / sku.

### 6.4 Mapping brand
Harus ada tabel mapping eksplisit, bukan fallback liar.

Aturan:
- brand provider -> game internal,
- kalau tidak dikenal, masuk antrean review,
- jangan auto-activate data yang belum dikenali,
- log semua mapping failure.

### 6.5 Produk tidak ter-load
Jika produk tidak muncul, cek urutan ini:

1. provider response masuk atau tidak,
2. raw data tersimpan atau tidak,
3. normalizer berhasil atau tidak,
4. mapping game berhasil atau tidak,
5. produk aktif atau tidak,
6. cache sudah di-refresh atau belum,
7. query frontend benar atau tidak,
8. UI tidak memfilter data berlebihan.

### 6.6 Kebijakan harga
Harga final harus dihitung oleh pricing engine internal.

Formula umum:
- base price + admin fee + margin + rounding.

Aturan:
- margin minimum harus dijaga,
- harga tidak boleh negatif,
- rounding harus konsisten,
- perubahan harga harus tercatat sebagai event.

---

## 7) Flow Sync Katalog yang Wajib Dipakai

### Flow utama
1. Scheduler memicu sync.
2. Worker request pricelist provider.
3. Raw response disimpan.
4. Response divalidasi.
5. Data dinormalisasi.
6. Mapping game / brand dicari.
7. Pricing dihitung.
8. Produk publik di-update.
9. Cache di-refresh.
10. Sync log dicatat.
11. Dashboard menerima update real-time.

### Aturan retry
- retry dengan backoff,
- jangan retry tanpa batas,
- jika gagal terus, pakai data terakhir yang valid,
- catat alasan gagal.

### Aturan publish
- jangan publish setengah jadi,
- jika sebagian data gagal, tandai batch sebagai partially failed,
- jangan rusak katalog publik karena satu provider bermasalah.

---

## 8) Flow Order yang Wajib Dipakai

### State machine order
Gunakan state yang jelas:

- `Draft`
- `PendingPayment`
- `Paid`
- `Processing`
- `Success`
- `Failed`
- `Refunded`
- `Cancelled`

### Aturan penting
- satu order hanya boleh punya satu jalur status yang valid,
- status harus bisa diaudit,
- update status harus idempotent,
- webhook dobel tidak boleh memproses ulang,
- semua perubahan status harus tercatat.

### Flow order ideal
1. user membuat order,
2. order dibuat pending,
3. payment diproses,
4. callback diverifikasi,
5. order masuk queue processing,
6. worker memanggil provider,
7. hasil disimpan,
8. status diperbarui,
9. user dan admin menerima notifikasi.

---

## 9) Backend Quality Rules

### 9.1 Service boundaries
Jangan campur semua logika di satu service besar.

Pisahkan:
- catalog service,
- sync service,
- pricing service,
- payment service,
- order service,
- audit service,
- notification service,
- provider client service.

### 9.2 Dependency rules
- domain layer tidak boleh bergantung ke framework,
- service layer tidak boleh tergantung UI,
- provider client hanya tahu kontrak provider,
- controller hanya koordinasi request/response.

### 9.3 Error handling
Setiap error harus punya:
- kode,
- pesan manusia,
- pesan teknis,
- context,
- trace id.

### 9.4 Logging
Semua log penting harus terstruktur.

Minimal log:
- provider request gagal,
- sync gagal,
- order gagal,
- payment callback gagal,
- auth gagal,
- permission denied,
- cache miss yang tidak biasa.

---

## 10) Frontend Quality Rules

### 10.1 Data source
Frontend hanya membaca dari API internal.

Tidak boleh:
- fetch provider langsung,
- menghitung bisnis yang seharusnya di backend,
- mengandalkan state lokal untuk data penting.

### 10.2 UX wajib ada
- loading skeleton,
- empty state,
- error state,
- retry button,
- fallback message,
- status badge yang jelas.

### 10.3 Demo-ready
UI demo harus menampilkan:
- katalog stabil,
- status provider,
- transaksi contoh,
- log sync,
- log order,
- role-based view,
- action yang tidak merusak data demo.

### 10.4 Accessibility
- kontras warna harus aman,
- teks harus terbaca,
- navigasi jelas,
- jangan mengandalkan warna saja untuk status,
- animasi jangan berlebihan.

---

## 11) Security Rules

- semua secret lewat environment / secret manager,
- validasi input di backend,
- rate limit endpoint sensitif,
- signature webhook diverifikasi,
- token refresh harus aman,
- audit admin action wajib,
- jangan pernah commit credential.

### Proteksi minimum
- authentication,
- authorization,
- input validation,
- CSRF protection bila relevan,
- replay protection,
- idempotency key,
- rate limiting,
- IP allowlist jika diperlukan.

---

## 12) Observability Rules

### Wajib ada
- health check,
- readiness check,
- structured logging,
- metrics dashboard,
- error rate,
- latency,
- success rate per provider,
- order funnel,
- alert jika sync gagal berturut-turut.

### Sinyal yang harus dipantau
- provider latency,
- provider timeout,
- sync success rate,
- order success rate,
- payment callback latency,
- cache hit ratio,
- queue length,
- worker failure rate.

---

## 13) Testing Rules

### Unit test
Untuk:
- pricing engine,
- sanitization,
- mapping brand,
- validation,
- status transition,
- idempotency logic.

### Integration test
Untuk:
- provider client,
- sync pipeline,
- webhook payment,
- order processing,
- auth flow.

### Smoke test
Untuk:
- login,
- katalog tampil,
- checkout,
- payment callback,
- tracking order,
- dashboard admin.

### Load test
Untuk:
- concurrent checkout,
- concurrent catalog fetch,
- websocket / SignalR event burst,
- sync worker under stress.

---

## 14) Deployment Rules

### Environment minimum
- local development,
- staging,
- production.

### Wajib dipisahkan
- database,
- env variables,
- secret,
- endpoint provider,
- webhook URL,
- cache,
- log sink.

### Containerization
Semua service inti harus bisa dijalankan via container.

### CI/CD minimum
- lint,
- test,
- build,
- migration check,
- docker build,
- deploy staging,
- manual approval untuk production.

---

## 15) Dokumentasi yang Harus Ada

### Dokumen inti
- README utama,
- architecture overview,
- provider integration spec,
- database schema,
- API contract,
- environment variables,
- deployment guide,
- troubleshooting guide,
- demo guide,
- migration notes.

### Aturan dokumentasi
- jangan ada versi ganda yang saling bertentangan,
- dokumentasi lama harus dihapus atau ditandai deprecated,
- setiap perubahan besar harus memperbarui dokumen.

---

## 16) Urutan Implementasi yang Disarankan

### Fase 1 — Stabilkan pondasi
- satukan dokumen,
- audit alur provider,
- betulkan mapping brand,
- pastikan katalog tampil dari DB internal,
- tambah logging sync.

### Fase 2 — Kunci transaksi
- state machine order,
- idempotency,
- webhook validation,
- retry logic,
- audit trail.

### Fase 3 — Jadikan demo-ready
- fallback state,
- data demo,
- dashboard operasional,
- error state yang rapi,
- smoke test.

### Fase 4 — Naikkan level ke enterprise
- metrics,
- tracing,
- alerting,
- load test,
- security hardening,
- CI/CD.

### Fase 5 — Scale up
- queue matang,
- cache matang,
- job orchestration,
- resiliency,
- optimisasi database.

---

## 17) Definition of Done

Sebuah fitur baru hanya dianggap selesai jika:

- berjalan tanpa error utama,
- ada test minimal,
- ada logging,
- ada dokumentasi singkat,
- tidak mematahkan flow lama,
- data konsisten,
- bisa dijelaskan oleh developer lain,
- bisa dipakai demo tanpa modifikasi manual besar.

---

## 18) Prompt Inti untuk AI Coding

Gunakan prompt ini saat minta AI mengerjakan bagian apa pun:

> Kamu adalah senior software engineer dan system designer.  
> Kerjakan perubahan berdasarkan dokumen master plan ini.  
> Jangan mengarang endpoint, field database, signature, atau alur bisnis yang tidak tertulis.  
> Jika informasi kurang, sebutkan asumsi dan risiko dengan jelas.  
> Prioritaskan stabilitas, data consistency, observability, security, dan demo-readiness.  
> Jangan mengubah arsitektur besar tanpa alasan.  
> Hasilkan perubahan yang bisa dirawat developer lain.  
> Sertakan daftar file yang diubah, alasan perubahan, dan acceptance criteria.

---

## 19) Prompt Tambahan untuk AI yang Merapikan Kode

> Refactor dengan target: lebih aman, lebih jelas, lebih mudah dites.  
> Jangan memperkenalkan pattern baru kalau pattern lama masih cukup.  
> Jangan membuat logic bisnis di frontend jika logic itu milik backend.  
> Jangan menduplikasi rules.  
> Jangan menambahkan dependency baru tanpa alasan kuat.  
> Bila ada perilaku yang tidak jelas, jangan berasumsi; tandai sebagai TODO terverifikasi.

---

## 20) Prompt Tambahan untuk AI yang Menganalisis Bug

> Cari sumber masalah dari bawah ke atas: data, mapping, cache, service, API, UI.  
> Jangan langsung menyalahkan frontend.  
> Jangan langsung menyalahkan provider.  
> Tunjukkan bukti dari log, data flow, atau kontrak.  
> Berikan diagnosis, dampak, kemungkinan akar masalah, dan langkah perbaikan.

---

## 21) Output Style yang Diinginkan dari AI

Setiap hasil AI harus berisi:

1. Ringkasan singkat masalah.
2. Akar masalah yang paling mungkin.
3. Rencana perbaikan.
4. File / modul yang terdampak.
5. Risiko dan asumsi.
6. Acceptance criteria.
7. Langkah verifikasi.

---

## 22) Catatan Khusus untuk Tim / Developer Lain

Dokumen ini dibuat supaya developer lain bisa masuk proyek tanpa membaca seluruh history chat.

Artinya:
- jangan tambahkan aturan tersembunyi,
- jangan ubah alur bisnis diam-diam,
- jangan jadikan AI satu-satunya sumber keputusan,
- gunakan dokumen ini sebagai baseline lalu kembangkan secara disiplin.

---

## 23) Penutup

Target proyek ini bukan sekadar “jalan”.  
Targetnya adalah:

- stabil,
- bisa dijelaskan,
- bisa diuji,
- bisa didemo,
- bisa dirawat,
- bisa diperluas.

Kalau ada bagian yang masih belum pasti, jangan dipaksakan.  
Lebih baik jelas mengatakan “belum terverifikasi” daripada mengisi celah dengan asumsi.
