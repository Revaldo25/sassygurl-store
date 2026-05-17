"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, Search,
  ShieldCheck, CreditCard, ChevronDown, Loader2,
  User, Phone
} from "lucide-react";
import type {
  NormalizedGame,
  GroupedProducts,
  NormalizedProduct,
  PaymentGroup,
  PaymentMethod
} from "@/lib/api-adapter";
import AccountInput from "@/components/AccountInput";
import PaymentAccordion from "@/components/PaymentAccordion";

type Props = {
  game: NormalizedGame;
  groupedByCategory: GroupedProducts[];
  paymentGroups: PaymentGroup[];
};

const formatIDR = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

export default function CheckoutClient({ game, groupedByCategory, paymentGroups }: Props) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validatedName, setValidatedName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [expandedPaymentGroup, setExpandedPaymentGroup] = useState<string | null>(null);

  const [whatsapp, setWhatsapp] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filter & Tabs
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // ── Computed ──────────────────────────────────────────────────────────────
  const calcFinal = (base: number, pm: PaymentMethod) =>
    base + pm.feeFlat + (base * (pm.feePercent / 100));

  const finalPrice = selectedProduct && selectedPayment
    ? calcFinal(selectedProduct.displayPrice, selectedPayment)
    : null;

  const canCheckout = !!userId && !!selectedProduct && !!selectedPayment && !!whatsapp;

  const filteredGroups = groupedByCategory
    .filter(g => activeTab === "ALL" || g.category.label.toUpperCase() === activeTab)
    .map(g => ({
      ...g,
      items: g.items.filter(item => 
        item.name.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }))
    .filter(g => g.items.length > 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!userId) return;
    setIsValidating(true);
    setValidatedName(null);
    setValidationError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamevalidation/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, targetId: userId, zoneId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setValidatedName(data.data.username);
      } else {
        setValidationError(data.message || "Gagal memvalidasi akun.");
      }
    } catch {
      setValidationError("Koneksi gagal. Pastikan backend menyala.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          productId: selectedProduct!.id,
          paymentMethodId: selectedPayment!.id,
          targetId: zoneId ? `${userId}|${zoneId}` : userId,
          whatsapp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = `/invoice/${data.data.invoiceId}`;
      } else {
        alert(data.message || "Gagal membuat pesanan.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsCheckingOut(false);
      setShowConfirmModal(false);
    }
  };

  // ── Step Header Component ────────────────────────────────────────────────
  const StepHeader = ({ num, title, done }: { num: number; title: string; done?: boolean }) => (
    <div className="flex items-center gap-4 mb-8">
      <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 ${
        done 
          ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
          : "bg-sakura/10 text-sakura border border-sakura/20 shadow-[0_0_20px_rgba(253,176,192,0.1)]"
      }`}>
        {done ? <CheckCircle2 className="w-5 h-5" /> : num}
        {!done && <div className="absolute inset-0 rounded-2xl bg-sakura/20 animate-ping opacity-20" />}
      </div>
      <div>
        <h2 className="text-lg font-black text-white tracking-tight leading-none mb-1">{title}</h2>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Step {num < 10 ? `0${num}` : num}</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="space-y-5 pb-4">

        {/* ──────────────────────────────────────────────────────────────────
            STEP 1: MASUKKAN DATA AKUN
            ────────────────────────────────────────────────────────────────── */}
        <AccountInput 
          gameSlug={game.slug}
          gameName={game.name}
          requiresZone={game.hasServerId}
          onResolved={(payload) => {
            setUserId(payload.id);
            setZoneId(payload.zone || "");
            setValidatedName(payload.username);
          }}
          stepLabel="STEP 01"
        />

        {/* ──────────────────────────────────────────────────────────────────
            STEP 2: PILIH NOMINAL
            ────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {validatedName && (
            <motion.section 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <StepHeader num={2} title="Pilih Nominal" done={!!selectedProduct} />
                
                <div className="group relative w-full sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-colors group-focus-within:text-sakura" />
                  <input
                    type="text"
                    placeholder="Cari item..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sakura/50 focus:ring-2 focus:ring-sakura/20 transition-all"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-6 mb-2 no-scrollbar">
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    activeTab === "ALL" 
                      ? "bg-sakura text-zinc-950 shadow-[0_10px_25px_-5px_rgba(253,176,192,0.4)] scale-105" 
                      : "bg-white/[0.03] text-zinc-500 border border-white/5 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  SEMUA
                </button>
                {groupedByCategory.map(g => (
                  <button
                    key={g.category.slug}
                    onClick={() => setActiveTab(g.category.label.toUpperCase())}
                    className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                      activeTab === g.category.label.toUpperCase()
                        ? "bg-sakura text-zinc-950 shadow-[0_10px_25px_-5px_rgba(253,176,192,0.4)] scale-105"
                        : "bg-white/[0.03] text-zinc-500 border border-white/5 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {g.category.label}
                  </button>
                ))}
              </div>

              {filteredGroups.length > 0 ? (
                filteredGroups.map((group, idx) => (
                  <div key={idx} className="mb-6 last:mb-0">
                    <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-500 mb-4">
                      {group.category.icon && <span className="text-lg">{group.category.icon}</span>}
                      {group.category.label}
                    </h3>
                    {/* Premium Card Grid: 3 col desktop, 2 col mobile */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map(product => {
                        const active = selectedProduct?.id === product.id;
                        // Better image resolving logic
                        const nominalMatch = product.name.match(/\d+/);
                        const nominalStr = nominalMatch ? nominalMatch[0] : "1";
                        // Priority: Product thumbnail -> Specific category folder -> Generic folder
                        const imageSrc = product.thumbnail || `/images/items/${game.slug}/${group.category.slug.toLowerCase()}/${nominalStr}.png`;

                        return (
                          <button
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className={`group relative flex items-center gap-4 p-5 rounded-[2rem] border text-left transition-all duration-500 overflow-hidden ${
                              active
                                ? "border-sakura bg-sakura/10 shadow-[0_20px_40px_-12px_rgba(253,176,192,0.2)] scale-[1.02]"
                                : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] hover:translate-y-[-2px]"
                            }`}
                          >
                            {/* Product Icon (Left) */}
                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-zinc-950/50 border border-white/10 p-2.5 overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                               <img 
                                 src={imageSrc} 
                                 alt={product.name} 
                                 className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(253,176,192,0.3)]"
                                 onError={(e) => {
                                   (e.target as HTMLImageElement).src = "/images/items/generic/diamond.png";
                                 }}
                               />
                            </div>
                            
                            {/* Product Details */}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-black leading-tight truncate mb-1.5 ${active ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                                {product.name}
                              </p>
                              <div className="flex flex-col gap-0.5">
                                <span className={`text-sm font-black tracking-tight ${active ? "text-sakura" : "text-sakura/90 group-hover:text-sakura"}`}>
                                  {formatIDR(product.displayPrice)}
                                </span>
                                {product.originalPrice && product.originalPrice > product.displayPrice && (
                                  <span className="text-[10px] text-zinc-600 font-bold line-through">
                                    {formatIDR(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Promo badge */}
                            {product.isFlashSale && (
                              <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-rose-500 text-[8px] font-black uppercase text-white px-3 py-1.5 rounded-bl-2xl rounded-tr-xl shadow-lg">
                                PROMO
                              </div>
                            )}
                            
                            {/* Selected Indicator Dot */}
                            {active && (
                              <motion.div 
                                layoutId="activeProduct"
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sakura rounded-full shadow-[0_0_12px_rgba(253,176,192,0.8)]"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                  <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-white/60 text-sm font-bold">Tidak ada produk ditemukan.</p>
                  <p className="text-white/40 text-xs mt-1">Coba kata kunci lain atau pilih tab berbeda.</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 3: PILIH PEMBAYARAN
            ────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.section 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5 overflow-hidden"
            >
              <StepHeader num={3} title="Pilih Pembayaran" done={!!selectedPayment} />
              <PaymentAccordion 
                groups={paymentGroups}
                selectedCode={selectedPayment?.code}
                onSelect={(method) => setSelectedPayment(method)}
                baseTotal={selectedProduct.displayPrice}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 4: KONTAK & CHECKOUT
            ────────────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedPayment && (
            <motion.section 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 overflow-hidden mb-24 lg:mb-0"
            >
              <StepHeader num={4} title="Informasi Kontak" />

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black font-mono text-sakura uppercase tracking-[0.3em] mb-3 block">Nomor WhatsApp</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-white/20 group-focus-within:text-sakura transition-colors" />
                    </div>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-sakura focus:ring-4 focus:ring-sakura/10 transition-all font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-white/20 mt-3 font-medium flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Nomor ini akan digunakan untuk mengirimkan rincian pesanan.
                  </p>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!canCheckout}
                  className="w-full bg-gradient-to-r from-sakura to-rose-500 hover:from-rose-400 hover:to-sakura text-zinc-950 font-black py-5 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(253,176,192,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm tracking-[0.2em]"
                >
                  <ShieldCheck className="w-5 h-5" />
                  BAYAR SEKARANG
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PREMIUM FLOATING SUMMARY BAR (Ditusi Style)
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-[95%] max-w-4xl"
          >
            <div className="bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 pl-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
              <div className="hidden sm:flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-sakura/10 flex items-center justify-center border border-sakura/20 shrink-0">
                   <img 
                     src={selectedProduct.thumbnail || `/images/items/generic/diamond.png`} 
                     className="w-8 h-8 object-contain" 
                   />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Item Terpilih</p>
                  <h4 className="text-sm font-black text-white truncate">{selectedProduct.name}</h4>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pr-2">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Total Pembayaran</p>
                  <p className="text-xl font-black text-sakura tracking-tighter">
                    {finalPrice ? formatIDR(finalPrice) : formatIDR(selectedProduct.displayPrice)}
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!canCheckout}
                  className="bg-sakura hover:bg-white text-zinc-950 font-black px-8 py-4 rounded-[2rem] text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-xl"
                >
                  BELI
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          CONFIRMATION MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirmModal && selectedProduct && selectedPayment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-center text-white mb-5">Konfirmasi Pesanan</h3>

              <div className="space-y-3 mb-6 text-sm">
                {[
                  ["Game", game.name],
                  ["Target", `${userId}${zoneId ? ` (${zoneId})` : ""}`],
                  ...(validatedName ? [["Nickname", validatedName]] : []),
                  ["Item", selectedProduct.name],
                  ["Pembayaran", selectedPayment.name],
                  ["WhatsApp", whatsapp],
                ].map(([label, val], i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/40">{label}</span>
                    <span className={`font-medium ${label === "Nickname" ? "text-emerald-400" : "text-white"}`}>{val}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-xl font-black text-sakura">{formatIDR(finalPrice!)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isCheckingOut}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="flex-1 py-3 bg-gradient-to-r from-sakura to-rose-500 text-zinc-950 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lanjut Bayar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}