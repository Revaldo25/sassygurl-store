"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, Search,
  ShieldCheck, Loader2, Phone, ShoppingBag
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

// ── Helper to clean raw Digiflazz product names ──────────────────────────────
function getCleanProductName(rawName: string): string {
  if (!rawName) return "Item";
  let cleanName = rawName.replace(/pre\d+\s*/i, ""); // Remove "pre31502724" patterns
  if (cleanName.match(/^\d{7,}\s/)) {
    // Extract everything after the giant Digiflazz numeric ID
    cleanName = cleanName.replace(/^\d{7,}\s*/, "");
  }
  return cleanName === "Astrite" ? rawName : cleanName;
}

// ── Asset Directory Mapping ────────────────────────────────────────────────
// Digiflazz categories are normalized (e.g., currency, pass, bundle).
// But local public/images folders use specific game nomenclature.
const GAME_ASSET_FOLDERS: Record<string, Record<string, string>> = {
  "akef": { currency: "origeometry", pass: "pass", bundle: "bundle" },
  "gi": { currency: "genesis_crystal", pass: "welkin_moon", bundle: "bundle" },
  "hsr": { currency: "oneiric_shards", pass: "pass", bundle: "bundle" },
  "mlbb": { currency: "diamond", pass: "pass", bundle: "bundle" },
  "wuwa": { currency: "lunites", pass: "subscription", bundle: "bundle" },
  "zzz": { currency: "monochromes", pass: "membership", bundle: "pack" },
  "lolwr": { currency: "wild_cores", pass: "celestial_blessings" },
  "lol": { currency: "rp" },
  "hok": { currency: "tokens" },
  "mccg": { currency: "gems", pass: "weekly_pass" },
  "nikke": { currency: "gems", pass: "pass", bundle: "set" },
  "pubg": { currency: "uc" },
  "rbx": { currency: "robux" },
  "valorant": { currency: "vp" },
};

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
  const [validatedName, setValidatedName] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  const [whatsapp, setWhatsapp] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Filter & Tabs
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  // ── Theme Styling Customizations ──────────────────────────────────────────
  const accent = game.accent || "#FDB0C0"; // Fallback to SassyGurl sakura pink

  // ── Computed ──────────────────────────────────────────────────────────────
  const calcPaymentFee = (base: number, pm: PaymentMethod) => {
    return pm.feeFlat + (base * (pm.feePercent / 100));
  };

  const paymentFee = selectedProduct && selectedPayment
    ? calcPaymentFee(selectedProduct.displayPrice, selectedPayment)
    : 0;

  const finalPrice = selectedProduct
    ? selectedProduct.displayPrice + paymentFee
    : null;

  const canCheckout = !!userId && !!selectedProduct && !!selectedPayment && !!whatsapp;

  const filteredGroups = groupedByCategory
    .filter(g => activeTab === "ALL" || g.category.label.toUpperCase() === activeTab)
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        // Search text match
        if (!item.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
        
        // Remove "Cek ID", "Cek Username", "Validator" items which are not real products
        const lname = item.name.toLowerCase();
        if (lname.includes("cek id") || lname.includes("cek username") || lname.includes("validator") || lname.includes("tester")) return false;
        
        // Remove ultra-low fake price items (e.g., 50 perak Cek ID tricks from Digiflazz)
        if (item.displayPrice <= 500) return false;
        
        return true;
      })
    }))
    .filter(g => g.items.length > 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenConfirm = () => {
    if (!userId) {
      alert("Harap isi Data Akun (User ID) Anda terlebih dahulu di Step 01.");
      document.getElementById("step-1")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (game.hasServerId && !zoneId) {
      alert("Harap isi Zone/Server ID game Anda di Step 01.");
      document.getElementById("step-1")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!selectedProduct) {
      alert("Harap pilih nominal topup/item.");
      return;
    }
    if (!selectedPayment) {
      alert("Harap pilih metode pembayaran.");
      return;
    }
    if (!whatsapp || whatsapp.length < 9) {
      alert("Harap isi nomor WhatsApp yang valid.");
      return;
    }

    // Generate fresh UUID for idempotency protection (Phase 1 rule compliance)
    const uuid = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    setIdempotencyKey(uuid);
    setShowConfirmModal(true);
    
    // Tiny haptic feedback if supported on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey // Backend idempotency integration
        },
        body: JSON.stringify({
          gameId: game.id,
          productId: selectedProduct!.id,
          paymentMethod: selectedPayment!.id,
          targetId: zoneId ? `${userId}|${zoneId}` : userId,
          whatsapp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        
        const token = data.data.paymentToken;
        // @ts-ignore - snap is loaded globally via Script tag
        if (window.snap && token && token.startsWith("SNAP-") === false && token.length > 20) {
          // @ts-ignore
          window.snap.pay(token, {
            onSuccess: function() {
              window.location.href = `/invoice/${data.data.invoiceId}`;
            },
            onPending: function() {
              window.location.href = `/invoice/${data.data.invoiceId}`;
            },
            onError: function() {
              window.location.href = `/invoice/${data.data.invoiceId}`;
            },
            onClose: function() {
              window.location.href = `/invoice/${data.data.invoiceId}`;
            }
          });
        } else {
          // Fallback if not Midtrans or token invalid
          window.location.href = `/invoice/${data.data.invoiceId}`;
        }
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
      <div 
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500"
        style={done 
          ? { backgroundColor: "#10b981", color: "#ffffff", boxShadow: "0 0 20px rgba(16,185,129,0.4)" } 
          : { backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}25`, boxShadow: `0 0 0 3px ${accent}10` }
        }
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : num}
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
        <div id="step-1">
          <AccountInput 
          gameSlug={game.slug}
          gameName={game.name}
          requiresZone={game.hasServerId}
          serverOptions={game.serverOptions}
          onResolved={(payload) => {
            setUserId(payload.id);
            setZoneId(payload.zone || "");
            setValidatedName(payload.username);
            // Mobile trigger vibration on nickname resolution
            if (payload.username && typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(30);
            }
          }}
          stepLabel="STEP 01"
        />
        </div>

        {groupedByCategory.length === 0 ? (
          <div className="rounded-[2rem] border border-red-500/10 bg-red-500/5 p-8 text-center mt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Item Sedang Tidak Tersedia</h3>
            <p className="text-sm text-white/50">
              Mohon maaf, produk untuk {game.name} saat ini sedang kosong atau dalam pemeliharaan sistem. Silakan kembali lagi nanti.
            </p>
          </div>
        ) : (
          <>
            {/* ──────────────────────────────────────────────────────────────────
                STEP 2: PILIH NOMINAL
                ────────────────────────────────────────────────────────────────── */}
            <section 
              className="rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 md:p-6 mt-3"
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
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sakura/50 focus:ring-2 focus:ring-sakura/20 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Tabs with Horizontal Mask */}
              <div className="flex gap-2 overflow-x-auto pb-6 mb-2 no-scrollbar scroll-smooth touch-pan-x">
                <button
                  onClick={() => setActiveTab("ALL")}
                  style={activeTab === "ALL" 
                    ? { backgroundColor: accent, color: "#09090b", boxShadow: `0 10px 25px -5px ${accent}66`, transform: "scale(1.05)" }
                    : {}
                  }
                  className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    activeTab === "ALL" ? "" : "bg-white/[0.03] text-zinc-500 border border-white/5 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  SEMUA
                </button>
                {groupedByCategory.map(g => {
                  const isActive = activeTab === g.category.label.toUpperCase();
                  return (
                    <button
                      key={g.category.slug}
                      onClick={() => setActiveTab(g.category.label.toUpperCase())}
                      style={isActive
                        ? { backgroundColor: accent, color: "#09090b", boxShadow: `0 10px 25px -5px ${accent}66`, transform: "scale(1.05)" }
                        : {}
                      }
                      className={`shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        isActive ? "" : "bg-white/[0.03] text-zinc-500 border border-white/5 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {g.category.label}
                    </button>
                  );
                })}
              </div>

              {filteredGroups.length > 0 ? (
                filteredGroups.map((group, idx) => {
                  const isCurrency = group.category.slug.toUpperCase() === "CURRENCY";
                  return (
                  <div key={idx} className="mb-8 last:mb-0">
                    <h3 className={`flex items-center gap-2 font-black uppercase tracking-widest mb-4 ${isCurrency ? "text-sm text-white/80" : "text-xs text-zinc-500"}`}>
                      {group.category.icon && <span className={isCurrency ? "text-lg" : "text-sm"}>{group.category.icon}</span>}
                      {group.category.label}
                    </h3>
                    <div className={`grid gap-3 ${isCurrency ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
                      {group.items.map(product => {
                        const active = selectedProduct?.id === product.id;
                        const nominalMatch = product.name.match(/\d+/);
                        const nominalStr = nominalMatch ? nominalMatch[0] : "1";
                        const folderName = GAME_ASSET_FOLDERS[game.slug]?.[group.category.slug.toLowerCase()] || group.category.slug.toLowerCase();
                        const imageSrc = product.thumbnail || `/images/items/${game.slug}/${folderName}/${nominalStr}.png`;
                        
                        const cleanName = getCleanProductName(product.name);

                        return (
                          <button
                            key={product.id}
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              setSelectedProduct(product);
                              if (typeof navigator !== "undefined" && navigator.vibrate) {
                                navigator.vibrate(15);
                              }
                            }}
                            className={`group relative flex items-center gap-3 p-3 rounded-[1.2rem] border text-left transition-all duration-300 overflow-hidden ${
                              active
                                ? "bg-white/[0.08] scale-[1.02] border-transparent"
                                : selectedProduct && !active
                                  ? "border-white/5 bg-white/[0.01] opacity-50 hover:opacity-80 hover:border-white/10"
                                  : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-0.5 shadow-sm"
                            }`}
                            style={active ? { borderColor: accent, boxShadow: `0 8px 30px -10px ${accent}40, inset 0 0 0 1px ${accent}` } : {}}
                          >
                            {/* Product Icon */}
                            <div className={`shrink-0 rounded-xl bg-zinc-950/50 border border-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${isCurrency ? "w-14 h-14 p-2" : "w-10 h-10 p-1.5"}`}>
                               <img 
                                 src={imageSrc} 
                                 alt={product.name} 
                                 className="w-full h-full object-contain"
                                 onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.onerror = null; // Prevent infinite loop
                                   target.src = game.icon; // Gunakan icon game sebagai fallback!
                                 }}
                               />
                            </div>
                            
                            {/* Product Details */}
                            <div className="min-w-0 flex-1 relative z-10">
                              <p className={`text-[12px] font-black leading-snug truncate mb-1 ${active ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                                {cleanName}
                              </p>
                              <div className="flex flex-col gap-0.5">
                                <span 
                                  className="text-xs font-black tracking-tight"
                                  style={{ color: active ? accent : `${accent}d9` }}
                                >
                                  {formatIDR(product.displayPrice)}
                                </span>
                                {product.originalPrice && product.originalPrice > product.displayPrice && (
                                  <span className="text-[9px] text-zinc-600 font-bold line-through">
                                    {formatIDR(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Promo badge */}
                            {product.isFlashSale && (
                              <div className="absolute top-0 right-0 bg-gradient-to-l from-rose-600 to-rose-500 text-[8px] font-black uppercase text-white px-2.5 py-1 rounded-bl-xl rounded-tr-lg shadow-lg">
                                PROMO
                              </div>
                            )}
                            
                            {/* Selected Indicator */}
                            {active && (
                              <motion.div 
                                layoutId="activeProduct"
                                className="absolute inset-0 rounded-[1.2rem] pointer-events-none"
                                style={{ 
                                  boxShadow: `inset 0 0 0 1.5px ${accent}, inset 0 0 20px ${accent}25` 
                                }}
                              >
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: accent, color: '#09090b' }}>
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                  <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-white/60 text-sm font-bold">Tidak ada produk ditemukan.</p>
                  <p className="text-white/40 text-xs mt-1">Coba kata kunci lain atau pilih tab berbeda.</p>
                </div>
              )}
            </section>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 3: PILIH PEMBAYARAN
            ────────────────────────────────────────────────────────────────── */}
        <section 
          className={`rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-500 mt-5 ${
            selectedProduct ? "opacity-100" : "opacity-40 grayscale pointer-events-none"
          }`}
        >
          <StepHeader num={3} title="Pilih Pembayaran" done={!!selectedPayment} />
          <PaymentAccordion 
            groups={paymentGroups}
            selectedCode={selectedPayment?.code}
            onSelect={(method) => {
              setSelectedPayment(method);
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(15);
              }
            }}
            baseTotal={selectedProduct?.displayPrice || 0}
            accent={accent}
          />
        </section>

        {/* ──────────────────────────────────────────────────────────────────
            STEP 4: KONTAK & CHECKOUT
            ────────────────────────────────────────────────────────────────── */}
        <section 
          className={`rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-sm p-4 md:p-6 mb-32 lg:mb-0 transition-all duration-500 mt-5 ${
            selectedPayment ? "opacity-100" : "opacity-40 grayscale pointer-events-none"
          }`}
        >
          <StepHeader num={4} title="Informasi Kontak" />

          <div className="space-y-6">
            <div>
              <label 
                className="text-[9px] font-black font-mono uppercase tracking-[0.3em] mb-3 block"
                style={{ color: accent }}
              >
                Nomor WhatsApp
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-white/50 font-black font-mono tracking-widest">+62</span>
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "");
                    setWhatsapp(val.startsWith("0") ? val.substring(1) : val);
                  }}
                  placeholder="81234567890"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-sakura focus:ring-4 focus:ring-sakura/10 transition-all font-bold"
                  inputMode="numeric"
                />
              </div>
              <p className="text-[10px] text-white/20 mt-3 font-medium flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Nomor ini akan digunakan untuk mengirimkan rincian pesanan.
              </p>
            </div>

            <button
              onClick={handleOpenConfirm}
              className={`w-full text-zinc-950 font-black py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 text-sm tracking-[0.2em] ${canCheckout ? "hover:scale-[1.02] hover:brightness-110 active:scale-95" : "cursor-not-allowed"}`}
              style={canCheckout 
                ? { backgroundColor: accent, boxShadow: `0 20px 40px -10px ${accent}60` }
                : { backgroundColor: accent, opacity: 0.3 }
              }
            >
              <ShieldCheck className="w-5 h-5" />
              {canCheckout ? "BAYAR SEKARANG" : "LENGKAPI DATA"}
            </button>
          </div>
        </section>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PREMIUM FLOATING SUMMARY BAR (Ditusi Style)
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            className="fixed bottom-[100px] sm:bottom-[110px] left-1/2 -translate-x-1/2 z-[50] w-[95%] max-w-4xl pb-safe"
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 pl-6 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] flex items-center justify-between gap-4">
              <div className="hidden sm:flex items-center gap-4 min-w-0">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 bg-white/5"
                  style={{ borderColor: `${accent}30` }}
                >
                   <ShoppingBag className="w-6 h-6 text-white/70" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Item Terpilih</p>
                  <h4 className="text-sm font-black text-white truncate">{getCleanProductName(selectedProduct.name)}</h4>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pr-2">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Total Pembayaran</p>
                  <p 
                    className="text-xl font-black tracking-tighter"
                    style={{ color: accent }}
                  >
                    {finalPrice ? formatIDR(finalPrice) : formatIDR(selectedProduct.displayPrice)}
                  </p>
                </div>
                <button
                  onClick={handleOpenConfirm}
                  className="text-zinc-950 font-bold px-6 py-3 rounded-2xl text-[11px] tracking-widest transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: accent, opacity: canCheckout ? 1 : 0.8 }}
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
          <ConfirmModal
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleCheckout}
            isLoading={isCheckingOut}
            game={game}
            userId={userId}
            zoneId={zoneId}
            validatedName={validatedName}
            selectedProduct={selectedProduct}
            selectedPayment={selectedPayment}
            whatsapp={whatsapp}
            paymentFee={paymentFee}
            finalPrice={finalPrice!}
            accent={accent}
          />
        )}
      </AnimatePresence>

      {/* Midtrans Snap — loaded only on checkout pages */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACCESSIBLE CONFIRMATION MODAL
// ══════════════════════════════════════════════════════════════════════════════
function ConfirmModal({
  onClose, onConfirm, isLoading,
  game, userId, zoneId, validatedName,
  selectedProduct, selectedPayment,
  whatsapp, paymentFee, finalPrice, accent,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  game: { name: string };
  userId: string;
  zoneId: string;
  validatedName: string | null;
  selectedProduct: { name: string; displayPrice: number };
  selectedPayment: { name: string };
  whatsapp: string;
  paymentFee: number;
  finalPrice: number;
  accent: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus the modal on mount
    modalRef.current?.focus();
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden outline-none"
      >
        {/* Accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />

        <h3 id="confirm-title" className="text-lg font-black text-center text-white mb-5">Rincian & Konfirmasi</h3>

        <div className="space-y-3 mb-6 text-xs">
          {[
            ["Game", game.name],
            ["Target ID / Server", `${userId}${zoneId ? ` (${zoneId})` : ""}`],
            ...(validatedName ? [["Nickname Akun", validatedName]] : []),
            ["Nama Item", selectedProduct.name],
            ["Metode Pembayaran", selectedPayment.name],
            ["WhatsApp Notifikasi", whatsapp],
          ].map(([label, val], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0 items-center">
              <span className="text-white/40 font-semibold">{label}</span>
              <span className={`font-black ${label === "Nickname Akun" ? "text-emerald-400" : "text-white"}`}>{val}</span>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between text-white/40">
              <span>Harga Item</span>
              <span className="font-semibold">{formatIDR(selectedProduct.displayPrice)}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Biaya Admin Gateway</span>
              <span className="font-semibold">{formatIDR(paymentFee)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <span className="text-white font-bold">Total Pembayaran</span>
            <span className="text-lg font-black" style={{ color: accent }}>{formatIDR(finalPrice)}</span>
          </div>
        </div>

        {/* Warning label */}
        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-orange-300 font-semibold leading-relaxed">
            Harap periksa kembali target ID dan server Anda. Kesalahan pengisian di luar tanggung jawab SassyGurl Store.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-xs tracking-wider uppercase transition-colors"
            aria-label="Batalkan pembelian"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 text-zinc-950 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: accent }}
            aria-label="Konfirmasi dan bayar sekarang"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bayar Sekarang"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}