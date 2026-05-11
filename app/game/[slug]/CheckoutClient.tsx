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

  // ── Computed ──────────────────────────────────────────────────────────────
  const calcFinal = (base: number, pm: PaymentMethod) =>
    base + pm.feeFlat + (base * (pm.feePercent / 100));

  const finalPrice = selectedProduct && selectedPayment
    ? calcFinal(selectedProduct.displayPrice, selectedPayment)
    : null;

  const canCheckout = !!userId && !!selectedProduct && !!selectedPayment && !!whatsapp;

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
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? "bg-emerald-500 text-white" : "bg-sakura/20 text-sakura"}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : num}
      </div>
      <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
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
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
          <StepHeader num={1} title="Masukkan Data Akun" done={!!validatedName} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">User ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="Masukkan User ID"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sakura/50 focus:border-sakura/30 transition-all placeholder:text-white/20"
                />
              </div>
            </div>
            {game.hasServerId && (
              <div>
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">Zone ID</label>
                <input
                  type="text"
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  placeholder="Zone ID"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sakura/50 focus:border-sakura/30 transition-all placeholder:text-white/20"
                />
              </div>
            )}
          </div>

          {/* Validate button + result */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleValidate}
              disabled={!userId || isValidating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white/70 transition-all disabled:opacity-40"
            >
              {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Cek Nickname
            </button>

            <AnimatePresence mode="wait">
              {validatedName && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {validatedName}
                </motion.div>
              )}
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 text-xs font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5" /> {validationError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 2: PILIH NOMINAL
            ────────────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
          <StepHeader num={2} title="Pilih Nominal" done={!!selectedProduct} />

          {groupedByCategory.length > 0 ? (
            groupedByCategory.map((group, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white/60 mb-3">
                  <span className="text-lg">{group.category.icon}</span>
                  {group.category.label}
                  <span className="ml-auto text-[10px] text-white/30">{group.items.length} item</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {group.items.map(product => {
                    const active = selectedProduct?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`group relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-200 h-[100px] overflow-hidden ${
                          active
                            ? "border-sakura bg-sakura/10 shadow-[0_0_24px_rgba(253,176,192,0.12)]"
                            : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                        }`}
                      >
                        <p className={`text-[13px] font-semibold leading-tight line-clamp-2 ${active ? "text-white" : "text-white/70"}`}>
                          {product.name}
                        </p>
                        <div className="flex items-baseline gap-1.5 mt-auto">
                          <span className={`text-sm font-bold ${active ? "text-sakura" : "text-sakura/70"}`}>
                            {formatIDR(product.displayPrice)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.displayPrice && (
                            <span className="text-[10px] text-white/30 line-through">
                              {formatIDR(product.originalPrice)}
                            </span>
                          )}
                        </div>
                        {/* Promo badge */}
                        {product.isFlashSale && (
                          <div className="absolute top-2 right-2 bg-rose-500 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md">
                            PROMO
                          </div>
                        )}
                        {/* Selected checkmark */}
                        {active && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-sakura" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            /* Fallback: Flat product list */
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">Belum ada produk tersedia untuk game ini.</p>
              <p className="text-white/20 text-xs mt-1">Silakan lakukan Sync API di Admin Dashboard.</p>
            </div>
          )}
        </section>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 3: PILIH PEMBAYARAN (ACCORDION GROUPS)
            ────────────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
          <StepHeader num={3} title="Pilih Pembayaran" done={!!selectedPayment} />

          {paymentGroups.length > 0 ? (
            <div className="space-y-2.5">
              {paymentGroups.map(group => {
                const isOpen = expandedPaymentGroup === group.groupKey;
                const hasSelected = group.methods.some(m => m.id === selectedPayment?.id);

                return (
                  <div key={group.groupKey} className={`rounded-xl border overflow-hidden transition-colors ${hasSelected ? "border-sakura/30" : "border-white/5"}`}>
                    {/* Accordion header */}
                    <button
                      onClick={() => setExpandedPaymentGroup(isOpen ? null : group.groupKey)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{group.countryFlag || "💳"}</span>
                        <span className="text-sm font-semibold text-white/70">{group.groupLabel}</span>
                        <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{group.methods.length}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Accordion body */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.methods.map(method => {
                              const active = selectedPayment?.id === method.id;
                              const price = selectedProduct ? calcFinal(selectedProduct.displayPrice, method) : null;

                              return (
                                <button
                                  key={method.id}
                                  onClick={() => setSelectedPayment(method)}
                                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                    active
                                      ? "border-sakura bg-sakura/10"
                                      : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {method.logo ? (
                                      <div className="w-10 h-7 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center p-1">
                                        <img src={method.logo} alt={method.name} className="max-w-full max-h-full object-contain" />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-7 bg-white/5 rounded-lg flex items-center justify-center text-white/30">
                                        <CreditCard className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-xs font-semibold text-white/80">{method.name}</p>
                                      <p className="text-[10px] text-white/30">Otomatis</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {price ? (
                                      <p className={`text-xs font-bold ${active ? "text-sakura" : "text-white/50"}`}>{formatIDR(price)}</p>
                                    ) : (
                                      <p className="text-[10px] text-white/20">Pilih item</p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Belum ada metode pembayaran tersedia.</p>
          )}
        </section>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 4: KONTAK & CHECKOUT
            ────────────────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-5">
          <StepHeader num={4} title="Nomor WhatsApp" />

          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sakura/50 focus:border-sakura/30 transition-all placeholder:text-white/20"
              />
            </div>
            <p className="text-[10px] text-white/30 mt-1.5">Status pesanan & bukti bayar dikirim via WhatsApp.</p>
          </div>

          {/* Order Summary */}
          {selectedProduct && selectedPayment && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 rounded-xl bg-sakura/5 border border-sakura/10"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sakura/60 mb-3">Ringkasan Pesanan</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Item</span>
                  <span className="text-white font-medium">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Harga</span>
                  <span className="text-white">{formatIDR(selectedProduct.displayPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Biaya Admin</span>
                  <span className="text-white/60">{formatIDR(finalPrice! - selectedProduct.displayPrice)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-white font-bold">Total Bayar</span>
                  <span className="text-sakura font-bold text-lg">{formatIDR(finalPrice!)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* CTA Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!canCheckout}
            className="w-full mt-5 bg-gradient-to-r from-sakura to-rose-500 hover:from-rose-400 hover:to-sakura text-zinc-950 font-black py-3.5 rounded-2xl shadow-[0_0_30px_rgba(253,176,192,0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wider"
          >
            <ShieldCheck className="w-4 h-4" />
            BELI SEKARANG
          </button>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STICKY BOTTOM BAR (MOBILE)
          ══════════════════════════════════════════════════════════════════════ */}
      {selectedProduct && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 safe-bottom">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/50 truncate">{selectedProduct.name}</p>
              <p className="text-base font-bold text-sakura">
                {finalPrice ? formatIDR(finalPrice) : formatIDR(selectedProduct.displayPrice)}
              </p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!canCheckout}
              className="shrink-0 bg-gradient-to-r from-sakura to-rose-500 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs tracking-wider disabled:opacity-30 transition-all"
            >
              BELI
            </button>
          </div>
        </div>
      )}

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