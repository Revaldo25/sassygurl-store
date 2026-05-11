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
      <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#09090b]/60 via-transparent to-[#09090b]" />
        <img
          src={game.banner}
          alt={game.name}
          className="w-full h-full object-cover scale-105"
        />
        {/* Floating Game Identity */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 flex items-end gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-neutral-800">
              <img src={game.icon} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight truncate">{game.name}</h1>
              <p className="text-white/50 text-sm mt-0.5 truncate">{game.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Trust Badges ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Zap, label: "Proses Instan", sub: "1-3 Detik" },
            { icon: ShieldCheck, label: "100% Aman", sub: "Anti Banned" },
            { icon: Clock, label: "24/7 Online", sub: "Auto Process" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 backdrop-blur-sm">
              <b.icon className="w-4 h-4 text-sakura shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{b.label}</p>
                <p className="text-[10px] text-white/40 truncate">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Main Content: 2 Columns ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-32 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: Sidebar — Game Info & Instructions */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20 order-2 lg:order-1">
            {/* Cara Top Up */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sakura/70 mb-4">Cara Top Up</h3>
              <ol className="space-y-3">
                {[
                  `Masukkan User ID${game.hasServerId ? " & Zone ID" : ""} Anda.`,
                  `Pilih nominal ${game.currencyName || "item"} yang diinginkan.`,
                  "Pilih metode pembayaran yang tersedia.",
                  "Masukkan nomor WhatsApp untuk notifikasi.",
                  "Klik Beli Sekarang dan selesaikan pembayaran.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/60">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sakura/10 text-sakura text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* CS Card */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Butuh Bantuan?</p>
              <p className="text-sm text-white/50">Hubungi Customer Service kami via WhatsApp untuk bantuan 24/7.</p>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                💬 Chat WhatsApp
              </a>
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
