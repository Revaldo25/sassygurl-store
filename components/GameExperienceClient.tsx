"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  NormalizedGame,
  NormalizedProduct,
  GroupedProducts,
  PaymentGroup,
  PaymentMethod,
} from "@/lib/api-adapter";
import { formatIDR } from "@/lib/catalog";
import AccountInput from "@/components/AccountInput";
import SiteHeader from "@/components/SiteHeader";
import {
  ShieldCheck,
  Zap,
  ChevronRight,
  CheckCircle2,
  Crown,
  Users,
  Diamond,
  ShoppingCart,
} from "lucide-react";

// ── Sub-components (defined below) ──────────────────────────────────────────
import ItemCategorySelector from "@/components/ItemCategorySelector";
import PaymentAccordion from "@/components/PaymentAccordion";

type Props = {
  game: NormalizedGame;
  products: NormalizedProduct[];
  groupedByCategory: GroupedProducts[];
  paymentGroups: PaymentGroup[];
};

export default function GameExperienceClient({
  game,
  products,
  groupedByCategory,
  paymentGroups,
}: Props) {
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    paymentGroups[0]?.methods[0] ?? null
  );
  const [resolvedAccount, setResolvedAccount] = useState<{
    id: string;
    zone?: string;
    username: string | null;
  } | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [complete, setComplete] = useState(false);

  const accent = game.accent;

  const basePrice = selectedProduct?.displayPrice ?? 0;
  const paymentFee =
    (selectedPayment?.feeFlat ?? 0) +
    Math.round(basePrice * ((selectedPayment?.feePercent ?? 0) / 100));
  const total = Math.max(0, basePrice + paymentFee - promoDiscount);

  // Step progress
  const steps = [
    { label: "Pilih Item",   done: Boolean(selectedProduct) },
    { label: "Input ID",     done: Boolean(resolvedAccount?.username) },
    { label: "Pembayaran",   done: Boolean(selectedPayment) },
  ];
  const stepsDone = steps.filter(s => s.done).length;

  const handleSelectProduct = useCallback((p: NormalizedProduct) => {
    setSelectedProduct(p);
    // Auto-scroll to step 2 on mobile
    setTimeout(() => {
      document.getElementById("step-input-id")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }, []);

  return (
    <main className="relative min-h-screen bg-zinc-950 text-white">
      <SiteHeader />

      {/* ═══ HERO BANNER ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <Image
            src={game.banner}
            alt={`${game.name} banner`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/70 to-transparent" />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at top center, ${accent}22, transparent 55%)`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-8 md:px-6 md:pb-16 md:pt-12">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            {/* Left — Game Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-end gap-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.28em]"
                  style={{ borderColor: `${accent}50`, backgroundColor: `${accent}15`, color: accent }}
                >
                  {game.currencyName.toUpperCase()}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white/65">
                  INSTANT DELIVERY
                </span>
                {game.isHot && (
                  <span className="rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-bold text-orange-300">
                    🔥 HOT
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
                  {game.name}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">
                  {game.description}
                </p>
              </div>

              <div className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Diamond, label: "Terjual", value: "99K+" },
                  { icon: Users,   label: "Online",  value: "9,999+" },
                  { icon: Crown,   label: "Rating",   value: "4.9★" },
                  { icon: Zap,     label: "Proses",   value: "≤ 1 min" },
                ].map(item => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                  >
                    <item.icon className="h-4 w-4" style={{ color: accent }} />
                    <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/40">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  ← Home
                </Link>
                <a
                  href="#pilih-item"
                  className="rounded-full px-5 py-3 text-sm font-black text-zinc-950 shadow-[0_0_24px_rgba(253,176,192,0.22)] transition hover:scale-[1.02]"
                  style={{ backgroundColor: accent }}
                >
                  Top Up {game.currencyName} ↓
                </a>
              </div>
            </motion.div>

            {/* Right — Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative flex items-end"
            >
              <div
                className="absolute inset-0 rounded-[2rem] blur-2xl"
                style={{ background: `radial-gradient(circle at center, ${accent}25, transparent 55%)` }}
              />
              <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/70 backdrop-blur-2xl">
                <div className="grid gap-4 p-5 md:grid-cols-2">
                  {/* Game icon */}
                  <div className="relative aspect-[1/1.1] overflow-hidden rounded-[1.5rem] border border-white/10">
                    <Image src={game.icon} alt={game.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-xs tracking-[0.24em] text-white/60">FEATURED</p>
                      <h2 className="text-lg font-bold text-white">{game.name}</h2>
                    </div>
                  </div>

                  {/* Step progress panel */}
                  <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                        Checkout Progress
                      </p>
                      <div className="mt-4 grid gap-3">
                        {steps.map((s, i) => (
                          <div key={s.label} className="flex items-center gap-3">
                            <div
                              className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-all",
                                s.done
                                  ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                                  : i === stepsDone
                                  ? "border-sakura/60 bg-sakura/10 text-sakura"
                                  : "border-white/15 bg-white/5 text-white/30",
                              ].join(" ")}
                            >
                              {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                            </div>
                            <p
                              className={`text-sm font-semibold ${
                                s.done
                                  ? "text-emerald-300"
                                  : i === stepsDone
                                  ? "text-white"
                                  : "text-white/35"
                              }`}
                            >
                              {s.label}
                            </p>
                            {i === stepsDone && !s.done && (
                              <ChevronRight className="ml-auto h-4 w-4 text-sakura/60" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className="rounded-2xl border p-4"
                      style={{ borderColor: `${accent}30`, backgroundColor: `${accent}12` }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Est. Total</p>
                      <p className="mt-1 text-2xl font-black text-white">{formatIDR(total)}</p>
                      {selectedProduct && (
                        <p className="mt-1 truncate text-xs text-white/50">{selectedProduct.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════════════ */}
      <div
        id="pilih-item"
        className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10"
      >
        {/* ── STEP 1: Pilih Kategori & Item ──────────────────────────── */}
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl">
          {/* Step header */}
          <div
            className="flex items-center gap-4 border-b border-white/8 px-5 py-4 md:px-7"
            style={{ backgroundColor: `${accent}08` }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black"
              style={{ backgroundColor: accent, color: "#09090b" }}
            >
              1
            </div>
            <div>
              <p className="text-base font-black text-white md:text-lg">
                Pilih Kategori &amp; Item
              </p>
              <p className="text-xs text-white/50">
                {game.productCount} produk tersedia
                {selectedProduct
                  ? ` · Dipilih: ${selectedProduct.name}`
                  : ""}
              </p>
            </div>
          </div>

          <ItemCategorySelector
            game={game}
            groupedByCategory={groupedByCategory}
            products={products}
            selectedSku={selectedProduct?.sku}
            onSelect={handleSelectProduct}
            accent={accent}
          />
        </div>

        {/* ── STEP 2: Input ID Akun ──────────────────────────────────── */}
        <div
          id="step-input-id"
          className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl"
        >
          <div
            className="flex items-center gap-4 border-b border-white/8 px-5 py-4 md:px-7"
            style={{ backgroundColor: `${accent}08` }}
          >
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
                resolvedAccount?.username
                  ? "bg-emerald-400 text-zinc-950"
                  : "",
              ].join(" ")}
              style={
                !resolvedAccount?.username
                  ? { backgroundColor: `${accent}30`, color: accent }
                  : {}
              }
            >
              {resolvedAccount?.username ? <CheckCircle2 className="h-5 w-5" /> : "2"}
            </div>
            <div>
              <p className="text-base font-black text-white md:text-lg">
                Masukkan ID Akun
              </p>
              <p className="text-xs text-white/50">
                {resolvedAccount?.username
                  ? `✓ ${resolvedAccount.username}`
                  : "User ID dan Zone/Server wajib diisi"}
              </p>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <AccountInput
              gameSlug={game.slug}
              gameName={game.name}
              requiresZone={game.hasServerId}
              mode="topup"
              onResolved={setResolvedAccount}
              stepLabel=""   // hide internal step label (parent shows it)
            />
          </div>
        </div>

        {/* ── STEP 3: Pilih Pembayaran ───────────────────────────────── */}
        <div className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div
            className="flex items-center gap-4 border-b border-white/8 px-5 py-4 md:px-7"
            style={{ backgroundColor: `${accent}08` }}
          >
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
                selectedPayment ? "bg-emerald-400 text-zinc-950" : "",
              ].join(" ")}
              style={
                !selectedPayment
                  ? { backgroundColor: `${accent}30`, color: accent }
                  : {}
              }
            >
              {selectedPayment ? <CheckCircle2 className="h-5 w-5" /> : "3"}
            </div>
            <div>
              <p className="text-base font-black text-white md:text-lg">
                Pilih Metode Pembayaran
              </p>
              <p className="text-xs text-white/50">
                {selectedPayment
                  ? `✓ ${selectedPayment.name}`
                  : "Pilih metode bayar favorit Anda"}
              </p>
            </div>
          </div>

          <PaymentAccordion
            groups={paymentGroups}
            selectedCode={selectedPayment?.code}
            onSelect={setSelectedPayment}
            baseTotal={basePrice}
            onPromoApplied={(_, discount) => setPromoDiscount(discount)}
            accent={accent}
          />
        </div>

        {/* ── STEP 4: Konfirmasi ─────────────────────────────────────── */}
        <div className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div
            className="flex items-center gap-4 border-b border-white/8 px-5 py-4 md:px-7"
            style={{ backgroundColor: `${accent}08` }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black"
              style={{ backgroundColor: `${accent}30`, color: accent }}
            >
              4
            </div>
            <p className="text-base font-black text-white md:text-lg">
              Konfirmasi &amp; Order
            </p>
          </div>

          <div className="p-5 md:p-7">
            <div className="grid gap-3 sm:grid-cols-3">
              <ConfirmCard
                label="Akun"
                value={resolvedAccount?.username ?? "Belum diisi"}
                done={Boolean(resolvedAccount?.username)}
              />
              <ConfirmCard
                label={game.currencyName}
                value={selectedProduct?.name ?? "Belum dipilih"}
                sub={selectedProduct ? formatIDR(selectedProduct.displayPrice) : undefined}
                done={Boolean(selectedProduct)}
                accent={accent}
              />
              <ConfirmCard
                label="Pembayaran"
                value={selectedPayment?.name ?? "Belum dipilih"}
                done={Boolean(selectedPayment)}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 md:p-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Total Bayar</p>
                <p className="mt-1 text-3xl font-black text-white">{formatIDR(total)}</p>
                {promoDiscount > 0 && (
                  <p className="text-xs text-emerald-400">Hemat {formatIDR(promoDiscount)}</p>
                )}
              </div>
              <button
                onClick={() => setComplete(true)}
                disabled={!selectedProduct || !resolvedAccount?.username || !selectedPayment}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-black text-zinc-950 shadow-[0_0_28px_rgba(253,176,192,0.25)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                <ShoppingCart className="h-4 w-4" />
                Order Sekarang!
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SUCCESS MODAL ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950/90 p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.6)]"
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${accent}20`, color: accent }}
              >
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h4 className="mt-4 text-2xl font-black text-white">Pesanan Diproses! ✨</h4>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Pesanan <strong className="text-white">{selectedProduct?.name}</strong> untuk akun{" "}
                <strong className="text-white">{resolvedAccount?.username}</strong> sedang diproses.
                Estimasi 1-5 menit.
              </p>
              <button
                onClick={() => setComplete(false)}
                className="mt-5 rounded-full px-5 py-3 text-sm font-black text-zinc-950"
                style={{ backgroundColor: accent }}
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ── Confirm Card ─────────────────────────────────────────────────────────────
function ConfirmCard({
  label,
  value,
  done,
  sub,
  accent,
}: {
  label: string;
  value: string;
  done?: boolean;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 transition-all",
        done ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/10 bg-zinc-950/60",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">{label}</p>
        {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-bold text-white">{value}</p>
      {sub && (
        <p className="mt-1 text-xs font-semibold" style={{ color: accent ?? "#FDB0C0" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
