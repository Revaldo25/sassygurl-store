import { getGameProducts, getGroupedPayments } from "@/lib/api-adapter";
import CheckoutClient from "./CheckoutClient";
import SiteHeader from "@/components/SiteHeader";
import { notFound } from "next/navigation";
import { Zap, ShieldCheck, Clock } from "lucide-react";

export default async function GameSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [{ game, groupedByCategory, products }, paymentGroups] = await Promise.all([
    getGameProducts(slug),
    getGroupedPayments(),
  ]);

  if (!game) return notFound();

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-sakura/40 selection:text-white">
      <SiteHeader />

      {/* ═══ Hero Banner ═══ */}
      <div className="relative h-[25vh] sm:h-[30vh] lg:h-[40vh] overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-zinc-950/20 via-zinc-950/40 to-zinc-950" />
        <img
          src={game.banner}
          alt={game.name}
          className="w-full h-full object-cover object-center scale-105 blur-[2px] opacity-60"
        />
        {/* Floating Game Identity */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
           <div className="text-center px-4">
              <div className="inline-block p-1 rounded-[2.5rem] bg-gradient-to-b from-white/20 to-transparent backdrop-blur-2xl mb-6 shadow-2xl animate-[fadeInUp_0.5s_ease-out]">
                <img src={game.icon} alt={game.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.2rem] object-cover border-2 border-white/10" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white mb-2 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
                {game.name}
              </h1>
              <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
                {game.publisher || "Official Partner"}
              </p>
           </div>
        </div>
      </div>

      {/* ═══ Trust Badges ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "PENGIRIMAN INSTAN", sub: "Rata-rata 1-3 detik saja." },
            { icon: ShieldCheck, label: "PEMBAYARAN AMAN", sub: "Enkripsi SSL & Payment Gateway." },
            { icon: Clock, label: "LAYANAN 24/7", sub: "Sistem otomatis tanpa libur." },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/50 p-5 backdrop-blur-xl shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-sakura/10 flex items-center justify-center shrink-0">
                <b.icon className="w-6 h-6 text-sakura" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white mb-0.5">{b.label}</p>
                <p className="text-[10px] text-white/30 font-semibold leading-tight">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Main Content: 2 Columns ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-32 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Sidebar — Game Info & Instructions */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <img src={game.icon} alt={game.name} className="w-16 h-16 rounded-3xl shadow-lg border border-white/10" />
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">{game.name}</h2>
                  <p className="text-xs font-bold text-sakura uppercase tracking-widest">{game.publisher}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                    <span className="w-1 h-3 bg-sakura rounded-full" />
                    Cara Top Up
                  </h3>
                  <ol className="space-y-4">
                    {[
                      `Masukkan User ID${game.hasServerId ? " & Zone ID" : ""} Anda.`,
                      `Pilih nominal ${game.currencyName || "item"} yang diinginkan.`,
                      "Pilih metode pembayaran yang tersedia.",
                      "Masukkan nomor WhatsApp untuk notifikasi.",
                      "Klik Beli Sekarang dan selesaikan pembayaran.",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4 text-sm text-white/60 leading-relaxed">
                        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-sakura text-xs font-black shrink-0">{i + 1}</span>
                        <span className="font-medium pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-sm text-white/40 font-medium leading-relaxed mb-6">
                    {game.description || "Top up game favoritmu dengan harga termurah dan pengiriman instan hanya di SassyGurl Store Ultra."}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40">ORIGINAL</span>
                    <span className="px-3 py-1.5 rounded-full bg-sakura/10 border border-sakura/20 text-[10px] font-bold text-sakura">PREMIUM</span>
                    <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/40">24/7 AUTO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Card */}
            <div className="rounded-[2rem] bg-sakura p-6 overflow-hidden relative group cursor-pointer">
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <h4 className="text-zinc-950 text-lg font-black leading-tight mb-1 relative z-10">Mau Diskon Lebih?</h4>
               <p className="text-zinc-950/60 text-xs font-bold relative z-10 mb-4">Daftar jadi Member VIP sekarang juga!</p>
               <button className="w-full py-3 bg-zinc-950 text-white rounded-2xl font-black text-xs tracking-widest relative z-10 hover:scale-105 transition-transform">
                 DAFTAR SEKARANG
               </button>
            </div>
          </aside>

          {/* RIGHT: Checkout Flow */}
          <main className="lg:col-span-8 order-1 lg:order-2">
            <CheckoutClient
              game={game}
              groupedByCategory={groupedByCategory}
              paymentGroups={paymentGroups}
            />
          </main>

        </div>
      </div>
    </div>
  );
}
