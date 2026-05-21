import { getGameProducts, getGroupedPayments } from "@/lib/api-adapter";
import CheckoutClient from "./CheckoutClient";
import SiteHeader from "@/components/SiteHeader";
import GameHero from "@/components/game/GameHero";
import FAQAccordion from "@/components/game/FAQAccordion";
import RelatedGamesGrid from "@/components/game/RelatedGamesGrid";
import { notFound } from "next/navigation";

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

      {/* ═══ Game Hero Section ═══ */}
      <GameHero
        name={game.name}
        publisher={game.publisher}
        icon={game.icon}
        banner={game.banner}
        accent={game.accent}
        currencyName={game.currencyName}
        description={game.description}
        isHot={game.isHot}
        productCount={game.productCount}
      />

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

          {/* RIGHT: Checkout Flow, FAQ, and Related Games */}
          <main className="lg:col-span-8 order-1 lg:order-2 space-y-6">
            <CheckoutClient
              game={game}
              groupedByCategory={groupedByCategory}
              paymentGroups={paymentGroups}
            />
            <FAQAccordion />
            <RelatedGamesGrid currentSlug={game.slug} />
          </main>

        </div>
      </div>
    </div>
  );
}

