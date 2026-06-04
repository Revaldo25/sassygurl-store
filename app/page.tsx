import Link from "next/link";
import { Compass, Zap, ShieldCheck, HelpCircle, ChevronDown } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import BannerCarousel from "@/components/BannerCarousel";
import GameCatalogClient from "@/components/GameCatalogClient";
import LiveTransactionFeed from "@/components/LiveTransactionFeed";
import { getAllGamesNormalized } from "@/lib/api-adapter";
import { fetchApi } from "@/lib/api-client";
import { PublicTransaction } from "@/components/LiveTransactionFeed";

export const dynamic = "force-dynamic";

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
      
      {/* Hero / Banner Carousel (Shorter height) */}
      <BannerCarousel />

      {/* Trust Strip (Compact) */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {[
            { icon: Zap, title: "Proses Instan", desc: "Masuk dalam 1-3 Detik" },
            { icon: ShieldCheck, title: "100% Aman & Resmi", desc: "Anti-banned & legal" },
            { icon: Compass, title: "Rute Termurah", desc: "Harga distributor langsung" },
          ].map((feat, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.04] opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${i * 100 + 200}ms` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sakura/10 text-sakura">
                <feat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{feat.title}</p>
                <p className="text-xs font-medium text-white/50">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Game Catalog (Core Product Discovery) */}
      <GameCatalogClient games={games} />

      {/* Live Transactions & Compact FAQ */}
      <section className="mx-auto max-w-7xl px-4 py-8 pb-20 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* Live Transactions */}
          <LiveTransactionFeed initialData={initialTransactions} />

          {/* Compact FAQ Block instead of massive marketing */}
          <div className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <HelpCircle className="h-5 w-5 text-sakura" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Pertanyaan Umum</h3>
                <p className="text-xs text-white/50">Info singkat seputar SassyGurl Store</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ["Berapa lama proses pesanan?", "Pesanan diproses otomatis dalam 1-3 detik setelah pembayaran berhasil dikonfirmasi oleh sistem."],
                ["Metode pembayaran apa saja?", "Kami menerima QRIS, E-Wallet (GoPay, OVO, Dana), Virtual Account, dan Minimarket."],
                ["Apakah akun saya aman?", "100% aman. Kami hanya membutuhkan User ID/Server tanpa perlu login atau password Anda."],
              ].map(([q, a], i) => (
                <details key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 text-sm font-bold text-white outline-none">
                    {q}
                    <ChevronDown className="h-4 w-4 text-white/40 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 text-xs leading-relaxed text-white/60">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
