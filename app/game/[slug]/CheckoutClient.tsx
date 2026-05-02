"use client";
import { useState } from "react";
import { createTransaction } from "@/app/actions/transaction"; // Import fungsi kasir otomatis

export default function CheckoutClient({ game, products }: any) {
  // 1. STATE MANAGEMENT GAME SPESIFIK
  const isGenshin = game.slug.includes("genshin");
  const isValorant = game.slug.includes("valorant");
  const isML = game.slug.includes("mlbb");

  const [targetId, setTargetId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [server, setServer] = useState(isGenshin ? "Asia" : "");
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  // State Pembayaran & Promo
  const [activePaymentCategory, setActivePaymentCategory] = useState("QRIS");
  const [payment, setPayment] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  
  // State Kontak & Loading Midtrans
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [waNotif, setWaNotif] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // State pelindung tombol bayar

  // 2. KALKULASI HARGA REAL-TIME
  const basePrice = selectedProduct ? selectedProduct.priceSell : 0;
  const subTotal = basePrice * quantity;
  const adminFee = payment ? payment.fee : 0;
  const notifFee = waNotif ? 500 : 0;
  
  // Logika Promo Dummy
  const discount = isPromoApplied ? subTotal * 0.1 : 0; 
  const grandTotal = subTotal + adminFee + notifFee - discount;

  const handleApplyPromo = () => {
    if (promoCode === "SULTANAPRIL") setIsPromoApplied(true);
    else alert("Kode Promo tidak valid!");
  };

  // 3. FUNGSI EKSEKUSI PEMBAYARAN MIDTRANS
  const handleCheckout = async () => {
    setIsLoading(true);
    
    // Kirim pesanan ke file Server Action
    const result = await createTransaction({
      productId: selectedProduct.id,
      targetId,
      zoneId,
      server,
      quantity,
      paymentMethod: payment?.id || "QRIS",
      email,
      whatsapp,
      waNotif
    });

    if (result.success && result.paymentToken) {
      // Panggil Pop-Up Midtrans Snap
      // @ts-ignore (Abaikan warning TypeScript karena objek snap dari external script)
      window.snap.pay(result.paymentToken, {
        onSuccess: function (result: any) {
          alert("Pembayaran Berhasil, Sultan! Proses Top-Up 1-3 detik.");
          setIsLoading(false);
          // Opsi: window.location.href = `/invoice/${result.order_id}`;
        },
        onPending: function (result: any) {
          alert("Menunggu pembayaran Anda. Silakan selesaikan.");
          setIsLoading(false);
        },
        onError: function (result: any) {
          alert("Pembayaran gagal!");
          setIsLoading(false);
        },
        onClose: function () {
          alert("Anda menutup pop-up sebelum membayar.");
          setIsLoading(false);
        }
      });
    } else {
      alert(result.message || "Gagal memproses pesanan.");
      setIsLoading(false);
    }
  };

  // 4. DATA METODE PEMBAYARAN
  const paymentCategories = [
    {
      id: "QRIS", title: "QRIS (Otomatis)", subtitle: "Dicek otomatis, 0 detik", icon: "📱",
      methods: [
        { id: "qris_all", name: "QRIS All Payment", fee: 750, logo: "https://api.iconify.design/bi:qr-code-scan.svg?color=white" }
      ]
    },
    {
      id: "EWALLET", title: "E-Wallet", subtitle: "GoPay, DANA, OVO", icon: "👛",
      methods: [
        { id: "gopay", name: "GoPay", fee: 1000, logo: "https://api.iconify.design/simple-icons:gojek.svg?color=white" },
        { id: "dana", name: "DANA", fee: 1000, logo: "https://api.iconify.design/tabler:wallet.svg?color=white" },
        { id: "ovo", name: "OVO", fee: 1500, logo: "https://api.iconify.design/mdi:wallet-bifold.svg?color=white" },
        { id: "shopeepay", name: "ShopeePay", fee: 2000, logo: "https://api.iconify.design/simple-icons:shopee.svg?color=white" }
      ]
    },
    {
      id: "VA", title: "Virtual Account Bank", subtitle: "BCA, Mandiri, BNI", icon: "🏦",
      methods: [
        { id: "bca", name: "BCA VA", fee: 4000, logo: "https://api.iconify.design/mdi:bank.svg?color=white" },
        { id: "mandiri", name: "Mandiri VA", fee: 4000, logo: "https://api.iconify.design/mdi:bank-outline.svg?color=white" },
        { id: "bni", name: "BNI VA", fee: 4000, logo: "https://api.iconify.design/mdi:bank.svg?color=white" }
      ]
    },
    {
      id: "RETAIL", title: "Gerai Retail", subtitle: "Alfamart, Indomaret", icon: "🏪",
      methods: [
        { id: "alfamart", name: "Alfamart", fee: 2500, logo: "https://api.iconify.design/mdi:store.svg?color=white" },
        { id: "indomaret", name: "Indomaret", fee: 2500, logo: "https://api.iconify.design/mdi:store-outline.svg?color=white" }
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-6 pb-32 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
      
      {/* ----------------- KIRI: FORM UTAMA ----------------- */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* STEP 1: INFORMASI AKUN */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8 relative overflow-hidden">
          <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sakura-dim)] text-[var(--sakura)] border border-[var(--sakura)]/30 text-sm">1</span>
            Data Akun
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-widest">{isValorant ? "Riot ID" : "User ID"}</label>
              <input 
                type="text" placeholder={isValorant ? "Contoh: Sassy#1234" : "Masukkan ID Akun"}
                value={targetId} onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4 text-sm font-medium outline-none focus:border-[var(--sakura)] transition-all text-white placeholder-zinc-600"
              />
            </div>
            
            {isML && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-widest">Zone ID</label>
                <input 
                  type="text" placeholder="Contoh: 1234" 
                  value={zoneId} onChange={(e) => setZoneId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4 text-sm font-medium outline-none focus:border-[var(--sakura)] transition-all text-white placeholder-zinc-600"
                />
              </div>
            )}

            {isGenshin && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-widest">Server</label>
                <select 
                  value={server} onChange={(e) => setServer(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4 text-sm font-medium outline-none focus:border-[var(--sakura)] text-white transition-all cursor-pointer"
                >
                  <option value="Asia">Server: Asia</option>
                  <option value="America">Server: America</option>
                  <option value="Europe">Server: Europe</option>
                  <option value="TW_HK_MO">Server: TW, HK, MO</option>
                </select>
              </div>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-4 font-medium">Untuk menemukan User ID, tap menu profil di dalam game.</p>
        </div>

        {/* STEP 2: PILIH ITEM */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-4 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sakura-dim)] text-[var(--sakura)] border border-[var(--sakura)]/30 text-sm">2</span>
              Pilih Nominal
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {products.map((p: any) => (
              <div 
                key={p.id} onClick={() => setSelectedProduct(p)}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 relative overflow-hidden ${
                  selectedProduct?.id === p.id 
                  ? "border-[var(--sakura)] bg-[var(--sakura-dim)]" 
                  : "border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-zinc-500"
                }`}
              >
                {selectedProduct?.id === p.id && (
                  <div className="absolute top-0 right-0 w-6 h-6 bg-[var(--sakura)] rounded-bl-lg flex items-center justify-center">
                    <span className="text-[#09090b] text-[10px] font-black">✓</span>
                  </div>
                )}
                <div className="text-sm font-bold mb-1 text-white leading-tight">{p.name}</div>
                <div className="text-[11px] text-[var(--sakura)] font-black">Rp {p.priceSell.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)]">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Kuantitas:</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--sakura-dim)] text-[var(--sakura)] font-black text-sm border border-[var(--border-subtle)] transition-colors">-</button>
              <span className="font-black text-sm w-6 text-center text-white">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--sakura-dim)] text-[var(--sakura)] font-black text-sm border border-[var(--border-subtle)] transition-colors">+</button>
            </div>
          </div>
        </div>

        {/* STEP 3: METODE PEMBAYARAN */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8 relative overflow-hidden">
          <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sakura-dim)] text-[var(--sakura)] border border-[var(--sakura)]/30 text-sm">3</span>
            Pembayaran
          </h2>

          {/* KUPON PROMO */}
          <div className="mb-6 rounded-xl border border-[var(--sakura)]/30 bg-[var(--bg-main)] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-lg bg-[var(--sakura-dim)] flex items-center justify-center">
                <span className="text-lg">🎟️</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Kode Promo</h4>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Lebih hemat hari ini</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                type="text" placeholder="MASUKKAN KODE" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} disabled={isPromoApplied}
                className="w-full md:w-40 rounded-lg bg-[var(--bg-card)] px-3 py-2 text-xs font-bold outline-none border border-[var(--border-subtle)] uppercase text-center disabled:opacity-50"
              />
              <button 
                onClick={handleApplyPromo} disabled={isPromoApplied || !promoCode}
                className="bg-[var(--sakura)] text-[#09090b] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[var(--sakura-hover)] transition-colors disabled:opacity-50"
              >
                {isPromoApplied ? "OK" : "Pakai"}
              </button>
            </div>
          </div>

          {/* ACCORDION PAYMENT */}
          <div className="space-y-3">
            {paymentCategories.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] overflow-hidden transition-all duration-300">
                <div 
                  onClick={() => setActivePaymentCategory(activePaymentCategory === cat.id ? "" : cat.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl opacity-90">{cat.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">{cat.title}</h4>
                    </div>
                  </div>
                  <div className={`text-[10px] text-[var(--text-muted)] transform transition-transform duration-300 ${activePaymentCategory === cat.id ? "rotate-180" : ""}`}>
                    ▼
                  </div>
                </div>
                
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${activePaymentCategory === cat.id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-main)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.methods.map((method) => {
                        const isSelected = payment?.id === method.id;
                        const methodTotal = subTotal + method.fee + notifFee - discount;
                        return (
                          <div 
                            key={method.id} onClick={() => setPayment(method)}
                            className={`relative flex flex-col justify-center p-3 rounded-lg border cursor-pointer transition-all duration-300 overflow-hidden ${
                              isSelected ? "border-[var(--sakura)] bg-[var(--sakura-dim)]" : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-zinc-500"
                            }`}
                          >
                            {isSelected && <div className="absolute top-0 right-0 w-5 h-5 bg-[var(--sakura)] rounded-bl-lg flex items-center justify-center"><span className="text-[#09090b] text-[8px] font-black">✓</span></div>}
                            
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-md bg-[var(--bg-main)] flex items-center justify-center p-1.5 border border-[var(--border-subtle)]">
                                <img src={method.logo} alt={method.name} className="w-full h-full object-contain opacity-90" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white leading-tight">{method.name}</div>
                                <div className="text-[9px] text-[var(--text-muted)]">Biaya: Rp {method.fee.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                            
                            {selectedProduct && (
                              <div className="pt-2 border-t border-[var(--border-subtle)] mt-1 flex justify-between items-center">
                                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)]">Total Bayar</span>
                                <span className={`text-xs font-black ${isSelected ? "text-[var(--sakura)]" : "text-white"}`}>
                                  Rp {methodTotal.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 4: KONTAK */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8 relative overflow-hidden">
          <h2 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sakura-dim)] text-[var(--sakura)] border border-[var(--sakura)]/30 text-sm">4</span>
            Detail Kontak
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <input type="email" placeholder="Alamat Email (Untuk Bukti)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4 text-sm font-medium outline-none focus:border-[var(--sakura)] text-white placeholder-zinc-600" />
            <input type="tel" placeholder="Nomor WhatsApp Aktif" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] p-4 text-sm font-medium outline-none focus:border-[var(--sakura)] text-white placeholder-zinc-600" />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--sakura)]/20 bg-[var(--sakura-dim)]">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--sakura)]">Notifikasi via WhatsApp (+Rp 500)</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Kirim status pesanan real-time.</p>
              </div>
            </div>
            <button onClick={() => setWaNotif(!waNotif)} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${waNotif ? 'bg-[var(--sakura)]' : 'bg-zinc-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#09090b] transition-all duration-300 ${waNotif ? 'left-[22px]' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- KANAN: SUMMARY STICKY ----------------- */}
      <div className="space-y-6 self-start lg:sticky lg:top-28">
        
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl">
          <h3 className="text-xs font-black uppercase tracking-widest mb-5 border-b border-[var(--border-subtle)] pb-3 text-white">Ringkasan Pesanan</h3>
          
          <div className="space-y-3 text-xs font-medium text-[var(--text-muted)] mb-6">
            <div className="flex justify-between items-center">
              <span>Item ({quantity}x)</span>
              <span className="text-white font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>
            {payment && (
              <div className="flex justify-between items-center">
                <span>Biaya Admin</span>
                <span className="text-white font-bold">Rp {adminFee.toLocaleString('id-ID')}</span>
              </div>
            )}
            {waNotif && (
              <div className="flex justify-between items-center text-green-400">
                <span>Notifikasi WA</span>
                <span className="font-bold">+ Rp 500</span>
              </div>
            )}
            {isPromoApplied && (
              <div className="flex justify-between items-center text-[var(--sakura)]">
                <span>Diskon Kupon</span>
                <span className="font-bold">- Rp {discount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-[var(--border-subtle)] pt-5 mb-6">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">Total Bayar</span>
            </div>
            <div className="text-3xl font-black text-[var(--sakura)] text-right tracking-tight">
              Rp {grandTotal.toLocaleString('id-ID')}
            </div>
          </div>

          {/* TOMBOL BAYAR DENGAN LOADING & SHIMMER */}
          <button 
            onClick={handleCheckout}
            disabled={!selectedProduct || !targetId || !payment || isLoading}
            className="w-full rounded-xl bg-white text-[#09090b] py-4 text-xs font-black tracking-widest uppercase disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all hover:bg-zinc-200 relative overflow-hidden group"
          >
            <span className="relative z-10 flex justify-center items-center gap-2">
              {isLoading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Memproses...
                </>
              ) : (
                <>
                  <span className="text-sm">🔒</span> Konfirmasi Pembayaran
                </>
              )}
            </span>
            {!isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}