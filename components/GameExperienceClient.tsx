"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Game,
  Product,
  PaymentMethod,
  formatIDR,
  getBestProvider,
  getSelectedPrice,
  paymentMethods,
  sortByBestValue,
} from "@/lib/catalog";
import AccountInput from "@/components/AccountInput";
import ProductGrid from "@/components/ProductGrid";
import PaymentSection from "@/components/PaymentSection";
import FloatingCheckoutBar from "@/components/FloatingCheckoutBar";
import JokiPanel from "@/components/JokiPanel";
import SiteHeader from "@/components/SiteHeader";
import { BadgeCheck, Crown, Diamond, ShieldCheck, Sparkles } from "lucide-react";

type Props = {
  game: Game;
};

export default function GameExperienceClient({ game }: Props) {
  const products = useMemo(() => sortByBestValue(game.products), [game.products]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] ?? null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(paymentMethods[0] ?? null);
  const [resolvedAccount, setResolvedAccount] = useState<{ id: string; zone?: string; username: string | null } | null>(null);
  const [complete, setComplete] = useState(false);

  const provider = selectedProduct ? getBestProvider(selectedProduct) : null;
  const bestPrice = selectedProduct ? getSelectedPrice(selectedProduct) : 0;
  const paymentFee = selectedPayment?.feeFlat ?? 0;
  const total = bestPrice + paymentFee + Math.round(bestPrice * ((selectedPayment?.feePercent ?? 0) / 100));
  const step = [resolvedAccount?.username, selectedProduct, selectedPayment].filter(Boolean).length;

  return (
    <main className="relative min-h-screen bg-zinc-950 text-white">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <video className="h-full w-full object-cover opacity-55" autoPlay muted loop playsInline poster={game.banner}>
            <source src="/media/hero-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.3),rgba(9,9,11,0.9)),radial-gradient(circle_at_top,rgba(253,176,192,0.16),transparent_45%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-16">
          <div className="flex flex-col justify-end gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sakura/30 bg-sakura/10 px-3 py-1 text-[10px] font-bold tracking-[0.28em] text-sakura">
                {game.shortCode} ELITE
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white/65">
                REACTIVE MODULAR UI
              </span>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">{game.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-lg">{game.description}</p>
            </div>
            <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Diamond, label: "Best route", value: provider?.name ?? "Auto" },
                { icon: Crown, label: "Popular", value: game.stats.sold },
                { icon: ShieldCheck, label: "Secure", value: "Encrypted" },
                { icon: Sparkles, label: "Est. total", value: formatIDR(total) },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl">
                  <item.icon className="h-4 w-4 text-sakura" />
                  <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/40">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10">
                Kembali ke Home
              </Link>
              <button className="rounded-full bg-sakura px-5 py-3 text-sm font-black text-zinc-950 shadow-[0_0_24px_rgba(253,176,192,0.22)]">
                Lihat {game.shortCode} Collection
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(253,176,192,0.22),transparent_55%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/60 shadow-[0_0_55px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="grid gap-4 p-4 md:grid-cols-[1fr_1fr]">
                <div className="relative aspect-[1/1.1] overflow-hidden rounded-[1.6rem] border border-white/10">
                  <Image src={game.banner} alt={game.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                </div>
                <div className="flex flex-col justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Live Stats</p>
                    <div className="mt-3 grid gap-3">
                      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Online sekarang</p>
                        <p className="mt-1 text-2xl font-black text-white">{game.stats.online}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Terjual</p>
                        <p className="mt-1 text-2xl font-black text-white">{game.stats.sold}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Rating</p>
                        <p className="mt-1 text-2xl font-black text-white">{game.stats.rating}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sakura/20 bg-sakura/10 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-sakura/80">Progress</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        animate={{ width: `${Math.max(18, step * 28)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-sakura via-fuchsia-400 to-cyan-300"
                      />
                    </div>
                    <p className="mt-3 text-sm text-white/70">Step {Math.max(1, step)} of 3 active. Checkout melayang aktif.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.08fr_0.92fr]">
          <AccountInput
            gameSlug={game.slug}
            gameName={game.shortCode}
            requiresZone={game.shortCode !== "PUBG"}
            mode="topup"
            onResolved={setResolvedAccount}
          />
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-3xl md:p-6">
            <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">STEP 00</p>
            <h3 className="mt-1 text-xl font-black text-white md:text-2xl">Mode Experience</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Glassmorphism neon",
                "Floating checkout bar",
                "Smart provider routing",
                "Dynamic username validation",
                "Premium motion hierarchy",
                "Audio feedback on CTA",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-zinc-950/[0.55] px-4 py-3 text-sm text-white/75">
                  <div className="inline-flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-300" />
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <ProductGrid
            title="Pilih Denom / Bundle"
            products={products}
            selectedSku={selectedProduct?.sku}
            onSelect={setSelectedProduct}
            accent={game.accent}
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
          <PaymentSection
            methods={paymentMethods}
            selectedCode={selectedPayment?.code}
            onSelect={setSelectedPayment}
            total={bestPrice}
            providerName={provider?.name}
          />
          <JokiPanel />
        </div>

        <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-3xl md:p-6">
          <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">STEP 04</p>
          <h3 className="mt-1 text-xl font-black text-white md:text-2xl">Konfirmasi Premium</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InfoCard label="Account" value={resolvedAccount?.username ?? "Belum valid"} />
            <InfoCard label="Product" value={selectedProduct?.name ?? "Pilih product"} />
            <InfoCard label="Payment" value={selectedPayment?.name ?? "Pilih payment"} />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Smart Provider Routing</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {provider ? `Auto route ke ${provider.name}` : "Pilih produk untuk melihat route termurah"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Total Basic</p>
                <p className="mt-1 text-2xl font-black text-white">{formatIDR(bestPrice)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Alur ini dibuat untuk meniru pengalaman top-up premium: user dipandu step-by-step, harga langsung dihitung, dan pembayaran dipilih tanpa kebingungan.
            </p>
          </div>
        </div>
      </div>

      <FloatingCheckoutBar
        product={selectedProduct}
        payment={selectedPayment}
        accountName={resolvedAccount?.username}
        onCheckout={() => setComplete(true)}
      />

      {complete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950/90 p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.6)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sakura/15 text-sakura">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h4 className="mt-4 text-2xl font-black text-white">Checkout siap diproses</h4>
            <p className="mt-2 text-sm leading-7 text-white/60">
              Ini preview premium. Nanti tinggal sambungkan ke Prisma + payment gateway untuk produksi penuh.
            </p>
            <button onClick={() => setComplete(false)} className="mt-5 rounded-full bg-sakura px-5 py-3 text-sm font-black text-zinc-950">
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">{label}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
