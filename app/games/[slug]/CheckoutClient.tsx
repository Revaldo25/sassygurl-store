"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, AlertCircle, Search,
  ShieldCheck, Loader2, Phone, ShoppingBag
, Gem, Package, Wallet, UserRound } from "lucide-react";
import type {
  NormalizedGame,
  GroupedProducts,
  NormalizedProduct,
  PaymentGroup,
  PaymentMethod
} from "@/lib/api-adapter";
import AccountInput from "@/components/AccountInput";
import PaymentAccordion from "@/components/PaymentAccordion";
import { createTransaction } from "@/app/actions/transaction";

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
  const [quantity, setQuantity] = useState(1);

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
    ? calcPaymentFee(selectedProduct.displayPrice * quantity, selectedPayment)
    : 0;

  const finalPrice = selectedProduct
    ? (selectedProduct.displayPrice * quantity) + paymentFee
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
      // ── Server Action: auth token otomatis disertakan, backend URL tidak bocor ke browser ──
      const data = await createTransaction(
        {
          productId: selectedProduct!.id,
          targetId: userId,
          zoneId: zoneId || undefined,
          quantity: quantity,
          paymentMethod: selectedPayment!.id,
          whatsapp,
          waNotif: !!whatsapp,
        },
        idempotencyKey
      );
      if (data.success) {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        
        const token = data.paymentToken;
        // @ts-ignore - snap is loaded globally via Script tag
        if (window.snap && token && !token.startsWith("SNAP-") && token.length > 20) {
          // @ts-ignore
          window.snap.pay(token, {
            onSuccess: function() { window.location.href = `/invoice/${data.invoiceId}`; },
            onPending: function()  { window.location.href = `/invoice/${data.invoiceId}`; },
            onError: function()    { window.location.href = `/invoice/${data.invoiceId}`; },
            onClose: function()    { window.location.href = `/invoice/${data.invoiceId}`; },
          });
        } else {
          window.location.href = `/invoice/${data.invoiceId}`;
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
  const StepHeader = ({ num, title, icon: Icon, done }: { num: number; title: string; icon?: any; done?: boolean }) => (
    <div className="relative z-10 mb-6 flex items-start gap-4">
      <div 
        className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-inner"
        style={done 
          ? { backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", boxShadow: "0 0 20px rgba(16,185,129,0.1)" } 
          : { backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}40`, boxShadow: `0 0 15px ${accent}20` }
        }
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : (Icon ? <Icon className="w-5 h-5 drop-shadow-md" /> : <span className="font-black text-sm">{num}</span>)}
      </div>
      <div className="pt-1">
        <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-0.5">Step 0{num}</p>
        <h2 className="text-xl font-bold text-white tracking-tight leading-none">{title}</h2>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">

      {/* =========================================================
          LEFT COLUMN: ID INPUT & PRODUCTS
          ========================================================= */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">

        {/* STEP 1: MASUKKAN DATA AKUN */}
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
              if (payload.username && typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(30);
              }
            }}
            stepLabel="STEP 1"
          />
        </div>

        {/* STEP 2: PILIH PRODUK */}
        {groupedByCategory.length === 0 ? (
          <div className="rounded-3xl border border-red-500/10 bg-red-500/5 p-8 text-center mt-6">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-2">Item Sedang Tidak Tersedia</h3>
            <p className="text-sm text-white/50">Mohon maaf, produk untuk {game.name} saat ini sedang kosong.</p>
          </div>
        ) : (
          <section className="glass-panel rounded-3xl p-5 md:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <StepHeader num={2} title="Pilih Item" icon={Package} done={!!selectedProduct} />
              
              <div className="group relative w-full sm:w-56">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-colors group-focus-within:text-sakura" />
                <input
                  type="text"
                  placeholder="Cari item..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-sakura/50 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
              <button
                onClick={() => setActiveTab("ALL")}
                style={activeTab === "ALL" 
                  ? { backgroundColor: accent, color: "#09090b" }
                  : {}
                }
                className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "ALL" ? "" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
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
                    style={isActive ? { backgroundColor: accent, color: "#09090b" } : {}}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isActive ? "" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {g.category.icon && (g.category.icon.startsWith('http') || g.category.icon.startsWith('/')) ? (
                        <img src={g.category.icon} alt="" className="w-3.5 h-3.5 object-contain" />
                      ) : g.category.icon ? (
                        <span className="text-xs">{g.category.icon}</span>
                      ) : null}
                      <span>{g.category.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group, idx) => (
                <div key={idx} className="mb-8 last:mb-0">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                    {group.category.icon && (group.category.icon.startsWith('http') || group.category.icon.startsWith('/')) ? (
                      <img src={group.category.icon} alt="" className="w-4 h-4 object-contain opacity-70" />
                    ) : group.category.icon ? (
                      <span>{group.category.icon}</span>
                    ) : null}
                    {group.category.label}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.items.map(product => {
                      const active = selectedProduct?.id === product.id;
                      const cleanName = getCleanProductName(product.name);

                      return (
                        <button
                          key={product.id}
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            setSelectedProduct(product);
                            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
                          }}
                          className={`group relative flex flex-col justify-center p-3 md:p-4 rounded-2xl border text-left transition-all overflow-hidden ${
                            active
                              ? "bg-white/[0.08] border-transparent"
                              : selectedProduct && !active
                                ? "border-obsidian-border hover:border-white/20 bg-white/[0.01] opacity-60 hover:opacity-100"
                                : "border-obsidian-border hover:border-white/20 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                          }`}
                          style={active ? { boxShadow: `0 0 0 1px ${accent}, inset 0 0 15px ${accent}15` } : {}}
                        >
                          {/* Item Name (Denomination) */}
                          <div className="flex items-center gap-2 mb-1.5 w-full">
                            <Gem className={`w-4 h-4 shrink-0 ${active ? "opacity-100" : "opacity-40"}`} style={active ? { color: accent } : {}} />
                            <p className={`text-xs md:text-sm font-semibold truncate flex-1 ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                              {cleanName}
                            </p>
                          </div>
                          
                          {/* Item Price */}
                          <p 
                            className={`text-sm md:text-lg font-black tracking-tighter ${active ? "" : "text-white drop-shadow-md"}`} 
                            style={active ? { color: accent, textShadow: `0 0 15px ${accent}80` } : {}}
                          >
                            {formatIDR(product.displayPrice)}
                          </p>

                          {/* Promo badge */}
                          {product.isFlashSale && (
                            <div className="absolute top-0 right-0 bg-rose-500 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-bl-xl shadow-lg">
                              PROMO
                            </div>
                          )}
                          
                          {/* Selected Checkmark */}
                          {active && (
                            <motion.div layoutId="check" className="absolute top-2 right-2" style={{ color: accent }}>
                              <CheckCircle2 className="w-4 h-4" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                <Search className="w-6 h-6 text-white/30 mx-auto mb-2" />
                <p className="text-white/50 text-sm">Item tidak ditemukan.</p>
              </div>
            )}

            {/* QUANTITY SELECTOR */}
            <AnimatePresence>
              {selectedProduct && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div>
                      <h4 className="text-sm font-bold text-white">Jumlah Pembelian</h4>
                      <p className="text-[10px] text-white/50 mt-0.5">Beli lebih dari 1 untuk produk yang sama</p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 rounded-xl p-1 border border-white/5">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                      >-</button>
                      <span className="font-black w-4 text-center">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                      >+</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>

      {/* =========================================================
          RIGHT COLUMN: PAYMENT, CONTACT & SUMMARY
          ========================================================= */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24">
        
        {/* STEP 3: PEMBAYARAN */}
        <section className={`glass-panel rounded-3xl p-5 md:p-6 transition-all ${
          selectedProduct ? "opacity-100" : "opacity-40 grayscale pointer-events-none"
        }`}>
          <StepHeader num={3} title="Pembayaran" icon={Wallet} done={!!selectedPayment} />
          <PaymentAccordion 
            groups={paymentGroups}
            selectedCode={selectedPayment?.code}
            onSelect={(method) => {
              setSelectedPayment(method);
              if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
            }}
            baseTotal={selectedProduct ? selectedProduct.displayPrice * quantity : 0}
            accent={accent}
          />
        </section>

        {/* STEP 4: KONTAK & CHECKOUT */}
        <section className={`glass-panel rounded-3xl p-5 md:p-6 transition-all duration-500 mt-5 mb-10 lg:mb-0 ${
          selectedPayment ? "opacity-100" : "opacity-40 grayscale pointer-events-none"
        }`}>
          <StepHeader num={4} title="Informasi Kontak" icon={UserRound} />

          <div className="space-y-4">
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
              <p className="text-[10px] text-blue-400 mt-3 font-medium flex items-center gap-2 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Nomor ini akan digunakan untuk mengirimkan rincian pesanan.
              </p>
            </div>
          </div>
        </section>

        {/* DESKTOP CHECKOUT SUMMARY BUTTON (Only visible on desktop) */}
        <div className={`hidden lg:block rounded-3xl p-6 transition-all duration-500 shadow-2xl ${
          canCheckout ? "opacity-100 scale-100" : "opacity-40 grayscale pointer-events-none scale-[0.98]"
        }`} style={{ backgroundColor: `${accent}10`, border: `1px solid ${accent}20` }}>
           
           <h4 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Ringkasan Pembelian</h4>
           
           <div className="space-y-3 mb-5 border-b border-white/10 pb-5">
             <div className="flex justify-between items-center text-xs">
               <span className="font-bold text-white/50">Game</span>
               <span className="font-black text-white">{game.name}</span>
             </div>
             
             <div className="flex justify-between items-center text-xs">
               <span className="font-bold text-white/50">Item</span>
               <span className="font-black text-white">{selectedProduct ? `${getCleanProductName(selectedProduct.name)} (x${quantity})` : "-"}</span>
             </div>

             {selectedPayment && paymentFee > 0 && (
               <div className="flex justify-between items-center text-xs">
                 <span className="font-bold text-white/50">Biaya Admin</span>
                 <span className="font-black text-white">{formatIDR(paymentFee)}</span>
               </div>
             )}
           </div>

           <div className="flex justify-between items-end mb-6">
             <span className="text-sm font-black text-white/60">Total</span>
             <span className="text-2xl font-black leading-none" style={{ color: accent }}>
               {finalPrice ? formatIDR(finalPrice) : (selectedProduct ? formatIDR(selectedProduct.displayPrice * quantity) : "Rp 0")}
             </span>
           </div>
           
           <button
             onClick={handleOpenConfirm}
             disabled={!canCheckout}
             className="w-full py-4 rounded-2xl font-black text-zinc-950 uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl"
             style={{ backgroundColor: accent, opacity: canCheckout ? 1 : 0.5 }}
           >
             <ShieldCheck className="w-5 h-5" />
             Beli Sekarang
           </button>
        </div>
      </div>

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
            className="fixed lg:hidden bottom-[100px] sm:bottom-[110px] left-1/2 -translate-x-1/2 z-[50] w-[95%] max-w-4xl pb-safe"
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
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Item Terpilih {quantity > 1 && `(x${quantity})`}</p>
                  <h4 className="text-sm font-black text-white truncate">{getCleanProductName(selectedProduct.name)}</h4>
                </div>
              </div>
              
              <div className="flex items-center gap-6 pr-2">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">
                    Total {selectedPayment && paymentFee > 0 && <span className="normal-case text-white/50">(+fee)</span>}
                  </p>
                  <p 
                    className="text-xl md:text-2xl font-black tracking-tighter drop-shadow-lg"
                    style={{ color: accent, textShadow: `0 0 20px ${accent}80` }}
                  >
                    {finalPrice ? formatIDR(finalPrice) : formatIDR(selectedProduct.displayPrice * quantity)}
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
            quantity={quantity}
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
  quantity: number;
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
            ["Nama Item", `${selectedProduct.name} (x${quantity})`],
            ["Metode Pembayaran", selectedPayment.name],
            ["WhatsApp Notifikasi", whatsapp],
          ].map(([label, val], i) => (
            <div key={i} className="flex justify-between py-2 border-b border-obsidian-border hover:border-white/20 last:border-0 items-center">
              <span className="text-white/40 font-semibold">{label}</span>
              <span className={`font-black ${label === "Nickname Akun" ? "text-emerald-400" : "text-white"}`}>{val}</span>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between text-white/40">
              <span>Harga Item {quantity > 1 && `(x${quantity})`}</span>
              <span className="font-semibold">{formatIDR(selectedProduct.displayPrice * quantity)}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Biaya Admin Gateway</span>
              <span className="font-semibold">{formatIDR(paymentFee)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <span className="text-white font-bold">Total Pembayaran</span>
            <span className="text-xl font-black tracking-tighter drop-shadow-md" style={{ color: accent, textShadow: `0 0 15px ${accent}80` }}>{formatIDR(finalPrice)}</span>
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