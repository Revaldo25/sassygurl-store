import Link from "next/link";
import Image from "next/image";
import { Compass, Zap, ShieldCheck, Gem } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import BannerCarousel from "@/components/BannerCarousel";
import GameCatalogClient from "@/components/GameCatalogClient";
import LiveTransactionFeed from "@/components/LiveTransactionFeed";
import { formatIDR } from "@/lib/catalog";
import { getAllGamesNormalized } from "@/lib/api-adapter";

import { fetchApi } from "@/lib/api-client";
import { PublicTransaction } from "@/components/LiveTransactionFeed";

export default async function HomePage() {
  const games = await getAllGamesNormalized();

  // Fetch real-time recent transactions
  const recentRes = await fetchApi<{ success: boolean; data: any[] }>("/transactions/recent").catch(() => ({ success: false, data: [] }));
  let initialTransactions: PublicTransaction[] = [];
  
  if (recentRes.success && recentRes.data) {
    initialTransactions = recentRes.data.map((tx: any, idx: number) => ({
      id: `tx-init-${idx}`,
      maskedTarget: tx.maskedTarget || "User",
      gameName: tx.gameName || "Game",
      productName: tx.productName || "Item",
      timestamp: new Date(tx.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <SiteHeader />
      
      {/* Hero / Banner Carousel */}
      <BannerCarousel />

      {/* Feature Highlights (UX Trust Signals) */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            // Zap: Kognitif mapping untuk "Instan/Frictionless"
            { icon: Zap, title: "Proses Otomatis", desc: "1-3 Detik masuk" },
            // ShieldCheck: Psikologi keamanan, mengurangi "Friction of Trust" saat checkout
            { icon: ShieldCheck, title: "100% Aman & Legal", desc: "Garansi anti-banned" },
            // Compass: Navigasi cerdas, menemukan rute/harga terbaik secara presisi
            { icon: Compass, title: "Routing Cerdas", desc: "Harga selalu termurah" },
          ].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sakura/10 text-sakura">
                <feat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{feat.title}</p>
                <p className="text-xs text-white/50">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Game Catalog (Ditusi Style Grid + Search/Filter) */}
      <GameCatalogClient games={games} />

      {/* Live Transactions + Why Premium */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 md:px-6 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Live Transactions */}
          <LiveTransactionFeed initialData={initialTransactions} />

          {/* Why Premium */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/30 p-6 backdrop-blur-3xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sakura/10 blur-[80px]" />
            
            <p className="relative text-[10px] font-bold tracking-[0.4em] text-sakura/75">SASSYGURL STORE ULTRA</p>
            <h3 className="relative mt-2 text-2xl font-black">Bukan hanya top-up, tapi experience</h3>
            
            <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Desain Premium", "Glassmorphism, glow effect, dan layout responsif yang memanjakan mata."],
                ["Smart Routing", "Sistem memilih provider termurah secara otomatis secara realtime."],
                ["Pembayaran Lengkap", "Dukung QRIS, E-Wallet, VA, dan minimarket dengan auto-deteksi fee."],
                ["Katalog Dinamis", "Mendukung ratusan produk dari berbagai game dengan kategori pintar."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">{text}</p>
                </div>
              ))}
            </div>

            <div className="relative mt-6 flex items-center justify-between rounded-2xl border border-sakura/20 bg-sakura/10 px-5 py-4">
               <div>
                 <p className="text-xs font-bold text-sakura">Mulai dari {formatIDR(1200)}</p>
                 <p className="text-[10px] text-white/60">Untuk entry item MLBB</p>
               </div>
               <Link href="/game/mlbb" className="rounded-full bg-sakura px-4 py-2 text-xs font-black text-zinc-950">
                 Coba Sekarang
               </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
