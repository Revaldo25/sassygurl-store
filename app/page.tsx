import Link from "next/link";
import { Compass, Zap, ShieldCheck, HelpCircle, ChevronDown, Gamepad2, Search } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import BannerCarousel from "@/components/BannerCarousel";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import GameCatalogClient from "@/components/GameCatalogClient";
import LiveTransactionFeed from "@/components/LiveTransactionFeed";
import LeaderboardBanner from "@/components/LeaderboardBanner";
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

  // Fetch active flash sale
  const flashSaleRes = await fetchApi<{ success: boolean; data: any }>("/catalog/flash-sale/active").catch(() => ({ success: false, data: null }));
  const flashSaleData = flashSaleRes.data;

  return (
    <main className="min-h-screen bg-obsidian text-white overflow-hidden">
      <SiteHeader />
      
      {/* ── Banner Carousel (Anime Heroes) ───────────────────────────── */}
      <BannerCarousel />

      {/* ── Holographic Trust Strip (Flash Deal Style) ────────────────────────────────────── */}
      <section className="relative z-20 mx-auto max-w-6xl px-4 py-6 md:px-6 md:-mt-16 -mt-8">
        <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 md:grid md:grid-cols-3 gap-3 md:gap-4 no-scrollbar">
          {[
            { icon: Zap, title: "Proses Kilat", desc: "Masuk dalam 1-3 Detik" },
            { icon: ShieldCheck, title: "100% Legal & Aman", desc: "Anti-banned jaminan uang kembali" },
            { icon: Compass, title: "Akses Distributor", desc: "Harga termurah se-Indonesia" },
          ].map((feat, i) => (
            <div
              key={i}
              className="group glass-card p-4 md:p-6 flex flex-col gap-3 md:gap-4 animate-fade-in-up min-w-[240px] md:min-w-0 snap-center shrink-0"
              style={{ animationDelay: `${i * 0.1 + 0.4}s` }}
            >
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-2xl bg-sakura/10 text-sakura border border-sakura/20 group-hover:scale-110 transition-transform duration-300">
                <feat.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-sm md:text-base font-bold text-white group-hover:text-sakura transition-colors">{feat.title}</p>
                <p className="text-[11px] md:text-sm font-medium text-zinc-500 mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flash Sale Banner ────────────────────────────────────────────── */}
      {flashSaleData && <FlashSaleBanner flashSaleData={flashSaleData} />}

      {/* ── Leaderboard VIP Banner ─────────────────────────────────────── */}
      <LeaderboardBanner />

      {/* ── The VIP Catalog ────────────────────────────────────────────── */}
      <div className="relative z-20 mt-4">
        <GameCatalogClient games={games} flashSaleGameIds={flashSaleData?.gameIds || []} />
      </div>

      {/* ── Live Transactions & VIP FAQ ────────────────────────────────── */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 py-16 pb-24 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Live Transactions wrapped in Premium Panel */}
          <div className="glass-panel rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-obsidian-border pb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-status-success"></span>
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">Live VIP Purchases</h3>
            </div>
            <LiveTransactionFeed initialData={initialTransactions} />
          </div>

          {/* Premium FAQ Block */}
          <div className="glass-panel rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8 border-b border-obsidian-border pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                <HelpCircle className="h-6 w-6 text-sakura" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">FAQ SassyGurl</h3>
                <p className="text-sm text-zinc-500 font-medium mt-1">Panduan transaksi eksklusif</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ["Berapa lama proses pesanan VIP?", "Pesanan diproses secara instan melalui API terenkripsi dalam 1-3 detik setelah pembayaran terverifikasi oleh gateway kami."],
                ["Metode pembayaran apa saja?", "Kami menerima QRIS, Virtual Account bank besar, serta E-Wallet premium untuk kenyamanan maksimal."],
                ["Apakah privasi & keamanan terjamin?", "Sangat terjamin. Kami beroperasi 100% legal dan hanya membutuhkan Server ID tanpa pernah meminta kredensial login Anda."],
              ].map(([q, a], i) => (
                <details key={i} className="group glass-card p-0 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-sm font-semibold text-white outline-none">
                    {q}
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-open:bg-sakura/10 group-open:text-sakura transition-colors">
                      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-zinc-400 font-medium">
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
