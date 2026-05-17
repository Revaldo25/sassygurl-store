# 💎 SassyGurl Store - Premium Game Top-up System

![SassyGurl Banner](https://img.shields.io/badge/Status-Production--Ready-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-.NET%2010%20%7C%20Next.js%20%7C%20PostgreSQL-blue)

**SassyGurl Store** adalah platform top-up game otomatis dengan standar kualitas tinggi yang menggabungkan kecepatan transaksi instan dengan pengalaman pengguna yang mewah. Dibangun menggunakan arsitektur modern untuk menangani ribuan transaksi dengan sinkronisasi harga real-time.

## ✨ Core Features (Enterprise-Grade)

- 🚀 **Automated SyncEngine**: Logika pembersihan nama produk otomatis (Regex Sanitizer) dan sistem pembanding harga termurah antar provider secara real-time.
- 💎 **Sultan Pricing Logic**: Margin dinamis dan pembulatan otomatis untuk memastikan keuntungan maksimal bagi Owner.
- 🔔 **SignalR Real-time Updates**: Status transaksi berubah secara otomatis di dashboard tanpa perlu refresh halaman.
- 🎨 **Luxury Glassmorphism UI**: Antarmuka modern dengan estetika Neon Pink dan Dark Mode yang responsif (Mobile-first).
- 🔐 **Role-Based Access Control**: Pemisahan fitur yang ketat antara **Owner** (Analitik & Profit), **Admin** (Katalog), dan **Member** (History & Loyalty).
- 🤖 **Bot Integration**: Notifikasi otomatis via Telegram/WhatsApp untuk laporan saldo dan sukses transaksi.

## 🛠 Tech Stack

- **Backend**: .NET 10 (ASP.NET Core API)
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Shadcn UI
- **Database**: PostgreSQL with Entity Framework Core
- **Real-time**: SignalR
- **Tunneling**: Ngrok (for Local Webhook Testing)
- **Architecture**: Clean Architecture / Repository Pattern

## 📖 HCI (IMK) Principles Applied
Proyek ini dikembangkan dengan mematuhi **8 Golden Rules Shneiderman**:
- **Consistency**: Tema warna dan tipografi seragam di seluruh dashboard.
- **Informative Feedback**: Fitur *Check Nickname* sebelum pembayaran.
- **Error Prevention**: Validasi input ID dan Zone secara ketat.

## 🚀 Getting Started

### Prerequisites
- .NET 10 SDK
- Node.js (Latest LTS)
- PostgreSQL Instance

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/username/sassygurl-store.git](https://github.com/username/sassygurl-store.git)