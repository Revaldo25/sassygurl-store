import Link from "next/link";
import { Compass, Zap, ShieldCheck, HelpCircle, ChevronDown, Gamepad2, Search } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
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
    <main className="min-h-screen bg-obsidian text-white overflow-hidden">
      <SiteHeader />
      
      {/* ── Immersive Glass Hero ────────────────────────────────────── */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center pt-24 pb-12 px-4 md:px-6 overflow-hidden">
        {/* Ambient Orbs Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-sakura-glow opacity-60 animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[70%] rounded-full bg-royal-glow opacity-40 animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }} />
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[40%] rounded-full bg-brand-cyan/5 blur-[120px] animate-pulse-slow" />
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sakura/20 bg-sakura/5 backdrop-blur-md mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sakura opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sakura"></span>
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-sakura">SassyGurl Premium Experience</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-balance mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Elevate Your <br className="hidden sm:block" />
            <span className="text-gradient-premium text-glow-sakura">Gaming Journey</span>
          </h1>
          
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl text-balance mb-12 animate-fade-in-up font-medium" style={{ animationDelay: '0.2s' }}>
            Akses instan ke top-up game dan voucher digital dengan harga eksklusif distributor. Rasakan pengalaman transaksi sultan tanpa batas.
          </p>

          <div className="w-full max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sakura to-royal rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center w-full h-16 rounded-[2rem] glass-panel px-6 hover:border-sakura/30 transition-colors">
                <Search className="h-5 w-5 text-sakura mr-4" />
                <input 
                  type="text" 
                  placeholder="Mau top-up game apa hari ini, Sultan?" 
                  className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-500 font-semibold"
                />
                <button className="hidden sm:block ml-4 px-6 py-2 rounded-xl bg-white text-obsidian font-bold text-xs hover:scale-105 transition-transform">
                  Cari
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-obsidian to-transparent z-10 pointer-events-none" />
      </section>

      {/* ── Holographic Trust Strip ────────────────────────────────────── */}
      <section className="relative z-20 mx-auto max-w-6xl px-4 py-8 md:px-6 -mt-16">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {[
            { icon: Zap, title: "Proses Kilat", desc: "Masuk dalam 1-3 Detik" },
            { icon: ShieldCheck, title: "100% Legal & Aman", desc: "Anti-banned jaminan uang kembali" },
            { icon: Compass, title: "Akses Distributor", desc: "Harga termurah se-Indonesia" },
          ].map((feat, i) => (
            <div
              key={i}
              className="group glass-card p-6 flex flex-col gap-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1 + 0.4}s` }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sakura/10 text-sakura border border-sakura/20 group-hover:scale-110 transition-transform duration-300">
                <feat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-white group-hover:text-sakura transition-colors">{feat.title}</p>
                <p className="text-sm font-medium text-zinc-500 mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── The VIP Catalog ────────────────────────────────────────────── */}
      <div className="relative z-20">
        <GameCatalogClient games={games} />
      </div>

      {/* ── Live Transactions & VIP FAQ ────────────────────────────────── */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 py-16 pb-24 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Live Transactions wrapped in Premium Panel */}
          <div className="glass-panel rounded-[2rem] p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-obsidian-border pb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
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
                <h3 className="text-xl font-bold text-white tracking-tight">SassyGurl Codex</h3>
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
