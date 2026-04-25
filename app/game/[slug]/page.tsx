"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ShieldCheck, Clock, ChevronRight, Loader2, UserCircle2, 
  Gem, CreditCard, Wallet, Store, Info, Star, ShoppingBag, 
  Zap, Search, ChevronDown, CheckCircle2, Ticket, Percent
} from "lucide-react";
// import { createTransaction } from "@/app/actions/transaction"; // Uncomment saat API siap

// ============================================================================
// 1. DATA MASTER (Mockup Database)
// ============================================================================

const MOCK_GAME = { 
  name: "Mobile Legends: Bang Bang", 
  slug: "mlbb",
  publisher: "Moonton",
  rating: 5.0,
  reviews: "64.8 rb Ulasan",
  sold: "106 rb Terjual",
  banner: "https://images.alphacoders.com/133/1330235.png" 
};

const CATEGORIES = ["Weekly Diamond Pass", "Diamonds", "Twilight Pass", "Starlight"];

const PRODUCTS = [
  { id: "WDP-1", name: "Weekly Diamond Pass", category: "Weekly Diamond Pass", price: 28790, originalPrice: 30306, ribbon: "-5% Termurah", popular: true },
  { id: "WDP-2", name: "Weekly Diamond Pass x2", category: "Weekly Diamond Pass", price: 57580, originalPrice: 60612, ribbon: "Termurah", popular: false },
  { id: "WDP-3", name: "Weekly Diamond Pass x3", category: "Weekly Diamond Pass", price: 86370, originalPrice: 90918, ribbon: "Termurah", popular: false },
  { id: "DM-1", name: "86 Diamonds", category: "Diamonds", price: 19500, originalPrice: 22000, ribbon: "", popular: true },
  { id: "DM-2", name: "172 Diamonds", category: "Diamonds", price: 38500, originalPrice: 44000, ribbon: "", popular: false },
  { id: "DM-3", name: "257 Diamonds", category: "Diamonds", price: 57500, originalPrice: 66000, ribbon: "Hot Item", popular: false },
  { id: "DM-4", name: "706 Diamonds", category: "Diamonds", price: 155000, originalPrice: 175000, ribbon: "Sultan Pick", popular: true },
];

const PAYMENT_CHANNELS = [
  {
    id: "ewallet",
    category: "E-Wallet & QRIS",
    icon: <Wallet className="w-5 h-5 text-brand-cyan" />,
    methods: [
      { id: "qris", name: "QRIS (Semua Bank & E-Wallet)", fee: 0, logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" },
      { id: "gopay", name: "GoPay", fee: 1000, logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" },
      { id: "dana", name: "DANA", fee: 1000, logo: "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_DANA.svg" },
      { id: "shopeepay", name: "ShopeePay", fee: 1000, logo: "https://upload.wikimedia.org/wikipedia/commons/f/fe/ShopeePay_Logo.png" },
    ]
  },
  {
    id: "va",
    category: "Virtual Account (Cek Otomatis)",
    icon: <CreditCard className="w-5 h-5 text-sakura" />,
    methods: [
      { id: "bca", name: "BCA Virtual Account", fee: 4500, logo: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" },
      { id: "mandiri", name: "Mandiri VA", fee: 4500, logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg" },
      { id: "bni", name: "BNI VA", fee: 4500, logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/BNI_logo.svg" },
      { id: "bri", name: "BRI VA", fee: 4500, logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg" },
    ]
  },
  {
    id: "retail",
    category: "Gerai Retail",
    icon: <Store className="w-5 h-5 text-orange-400" />,
    methods: [
      { id: "alfamart", name: "Alfamart", fee: 5000, logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg" },
      { id: "indomaret", name: "Indomaret", fee: 5000, logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Logo_Indomaret.png" },
    ]
  }
];

const PROMOS = [
  { id: 1, tag: "BEST DEAL", title: "GEBYAR SULTAN APRIL", subtitle: "Top Up Sekarang dan Menangkan Gear Gaming Premium!", image: MOCK_GAME.banner },
  { id: 2, tag: "FLASH SALE", title: "DISKON WEEKEND", subtitle: "Potongan harga hingga 20% khusus metode pembayaran QRIS.", image: "https://images8.alphacoders.com/133/1338694.png" }
];

// ============================================================================
// 2. KUMPULAN KOMPONEN (MODULAR IN-FILE)
// ============================================================================

const PromoBannerSlider = () => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % PROMOS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-[2rem] overflow-hidden relative h-[250px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes kenBurns { 0% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .animate-ken-burns { animation: kenBurns 5s ease-out forwards; }
      `}} />
      <div key={current} className="absolute inset-0 animate-ken-burns">
        <Image src={PROMOS[current].image} alt="Promo" fill className="object-cover opacity-60 mix-blend-screen" priority />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-full md:w-3/4" />
      
      <div className="relative h-full flex flex-col justify-center px-8 md:px-10 z-10">
        <div className="inline-flex items-center w-max gap-2 px-3 py-1 rounded-md bg-sakura text-zinc-950 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(253,176,192,0.4)] mb-4">
          {PROMOS[current].tag}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">{PROMOS[current].title}</h2>
        <p className="text-xs md:text-sm text-zinc-300 font-medium max-w-md">{PROMOS[current].subtitle}</p>
      </div>

      <div className="absolute bottom-6 right-8 flex gap-2 z-20">
        {PROMOS.map((_, idx) => (
          <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === current ? "bg-sakura w-8 shadow-[0_0_10px_rgba(253,176,192,0.8)]" : "bg-white/20 w-2"}`} />
        ))}
      </div>
    </div>
  );
};

const GameProfile = () => (
  <div className="glass-elite p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden h-full">
    <div className="absolute top-0 right-0 w-64 h-64 bg-sakura/10 blur-[80px] pointer-events-none" />
    <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-[1.5rem] overflow-hidden bg-white border-2 border-sakura shadow-[0_0_20px_rgba(253,176,192,0.3)] relative z-10">
      <Image src="https://placehold.co/400x400/09090b/FDB0C0?text=MLBB" alt="Game Logo" fill className="object-cover" />
    </div>
    <div className="flex-1 text-center md:text-left relative z-10 space-y-3">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">{MOCK_GAME.name}</h1>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{MOCK_GAME.publisher}</p>
      </div>
      <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> {MOCK_GAME.rating}</div>
        <div className="flex items-center gap-1.5 text-xs font-black text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><ShoppingBag className="w-3.5 h-3.5 text-brand-cyan" /> {MOCK_GAME.sold}</div>
        <div className="flex items-center gap-1.5 text-xs font-black text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Clock className="w-3.5 h-3.5 text-green-400" /> Auto Process</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// 3. MAIN PAGE COMPONENT
// ============================================================================

export default function UltimateTopUpPage() {
  const router = useRouter();
  
  // States
  const [formData, setFormData] = useState({ userId: "", serverId: "", denomId: "", paymentId: "" });
  const [activeTab, setActiveTab] = useState(CATEGORIES[0]);
  const [expandedPayment, setExpandedPayment] = useState<string>("ewallet");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = PRODUCTS.filter(p => p.category === activeTab);
  const isFormValid = useMemo(() => formData.userId.length >= 3 && formData.denomId !== "" && formData.paymentId !== "", [formData]);

  // Kalkulasi Harga
  const calc = useMemo(() => {
    const item = PRODUCTS.find(p => p.id === formData.denomId);
    let fee = 0;
    PAYMENT_CHANNELS.forEach(cat => {
      const method = cat.methods.find(m => m.id === formData.paymentId);
      if (method) fee = method.fee;
    });
    const subtotal = item ? item.price : 0;
    const totalDiscount = subtotal > 0 ? discount : 0;
    return { subtotal, fee, discount: totalDiscount, total: subtotal + fee - totalDiscount, name: item?.name };
  }, [formData.denomId, formData.paymentId, discount]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === "SULTANAPRIL") {
      setDiscount(15000); // Contoh diskon flat
      alert("Kode Promo Berhasil Diterapkan!");
    } else {
      alert("Kode Promo Tidak Valid!");
      setDiscount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);
    // Simulasi Proses
    setTimeout(() => {
      alert("Simulasi Berhasil! (Silakan uncomment fungsi createTransaction untuk produksi)");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20 selection:bg-sakura/30 font-sans">
      <div className="max-w-[1250px] mx-auto px-4 sm:px-6">
        
        {/* ROW 1: HEADER (Banner Kiri, Profil Kanan) */}
        <div className="grid lg:grid-cols-12 gap-6 mb-10">
          <div className="lg:col-span-7"><PromoBannerSlider /></div>
          <div className="lg:col-span-5"><GameProfile /></div>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI: STEPS INPUT (LEBAR 8) */}
          <div className="lg:col-span-8 space-y-8">

            {/* LIVE TICKER ALERT */}
            <div className="bg-sakura/10 border border-sakura/30 rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(253,176,192,0.1)]">
              <div className="w-10 h-10 rounded-full bg-sakura flex items-center justify-center animate-pulse shrink-0">
                <Zap className="w-5 h-5 text-zinc-950 fill-zinc-950" />
              </div>
              <div>
                <p className="text-sm font-black text-sakura uppercase tracking-tight">174 Item Dibeli Hari Ini!</p>
                <p className="text-[10px] font-medium text-zinc-400">Sistem otomatis kami sedang memproses pesanan dengan sangat cepat.</p>
              </div>
            </div>

            {/* STEP 1: DATA AKUN */}
            <div className="glass-elite p-6 sm:p-8 rounded-[2rem] border-l-4 border-l-sakura relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-black text-sakura">1</span>
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Masukkan Data Akun</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-5 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">ID Player</label>
                  <input type="text" required placeholder="Ketikan ID Player" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white font-bold focus:border-sakura outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Server (Zone ID)</label>
                  <input type="text" required placeholder="Ketikan Zone ID" value={formData.serverId} onChange={e => setFormData({...formData, serverId: e.target.value})} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white font-bold focus:border-sakura outline-none transition-all" />
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-4 font-medium">*Untuk mengetahui User ID Anda, silahkan klik menu profile dibagian kiri atas pada menu utama game.</p>
            </div>

            {/* STEP 2: PILIH PRODUK (Tabs + Grid) */}
            <div className="glass-elite p-6 sm:p-8 rounded-[2rem] border-l-4 border-l-sakura">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-black text-sakura">2</span>
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Pilih Kategori & Item</h2>
              </div>

              {/* TABS KATEGORI */}
              <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} type="button" onClick={() => setActiveTab(cat)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                      activeTab === cat ? "bg-sakura text-zinc-950 shadow-[0_0_15px_rgba(253,176,192,0.4)]" : "bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* GRID PRODUK */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredProducts.map(p => (
                  <button
                    key={p.id} type="button" onClick={() => setFormData({...formData, denomId: p.id})}
                    className={`p-4 rounded-2xl border text-left relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[120px] ${
                      formData.denomId === p.id ? "border-sakura bg-sakura/10 scale-[1.02]" : "border-white/5 bg-zinc-950 hover:border-white/20"
                    }`}
                  >
                    {/* Ribbon Diskon (Gaya Ditusi) */}
                    {p.ribbon && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[8px] font-black px-3 py-1 rounded-br-xl uppercase tracking-widest z-10 shadow-md">
                        {p.ribbon}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <div className="w-8 h-8 relative mb-2 opacity-80"><Image src="/diamond-icon.png" alt="DM" fill className="object-contain" /></div>
                      <div className={`text-xs font-black uppercase tracking-tight leading-tight mb-1 transition-colors ${formData.denomId === p.id ? "text-sakura" : "text-white"}`}>{p.name}</div>
                    </div>
                    
                    <div className="mt-2 w-full pt-3 border-t border-white/5">
                      {p.originalPrice > p.price && <div className="text-[9px] text-zinc-500 line-through font-bold mb-0.5">Rp {p.originalPrice.toLocaleString('id-ID')}</div>}
                      <div className="text-sm font-black text-white flex items-center gap-1.5">
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/9/9f/Flag_of_Indonesia.svg" alt="ID" width={14} height={10} className="rounded-sm" />
                        Rp {p.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: PEMBAYARAN (ACCORDION GAYA DITUSI) */}
            <div className="glass-elite p-6 sm:p-8 rounded-[2rem] border-l-4 border-l-sakura">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-black text-sakura">3</span>
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Pilih Pembayaran</h2>
              </div>
              
              <div className="space-y-4">
                {PAYMENT_CHANNELS.map((cat) => (
                  <div key={cat.id} className="rounded-2xl border border-white/5 bg-zinc-950 overflow-hidden">
                    {/* Header Accordion */}
                    <button 
                      type="button" onClick={() => setExpandedPayment(expandedPayment === cat.id ? "" : cat.id)}
                      className="w-full flex items-center justify-between p-5 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-white/5">{cat.icon}</div>
                        <span className="text-sm font-black text-white uppercase tracking-tight">{cat.category}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${expandedPayment === cat.id ? "rotate-180" : ""}`} />
                    </button>

                    {/* Content Accordion */}
                    <div className={`transition-all duration-500 ease-in-out ${expandedPayment === cat.id ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="p-5 grid sm:grid-cols-2 gap-3 bg-zinc-950/50">
                        {cat.methods.map(m => (
                          <button
                            key={m.id} type="button" onClick={() => setFormData({...formData, paymentId: m.id})}
                            className={`flex flex-col p-4 rounded-xl border transition-all duration-300 ${
                              formData.paymentId === m.id ? "border-sakura bg-sakura/5 shadow-inner scale-[1.02]" : "border-white/5 bg-zinc-900 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3 w-full">
                              <div className="w-full max-w-[60px] h-8 bg-white rounded-md p-1 flex items-center justify-center"><img src={m.logo} alt={m.name} className="max-h-full object-contain" /></div>
                              <div className="text-left flex-1"><p className="text-xs font-black text-white uppercase tracking-tighter truncate">{m.name}</p></div>
                              {formData.paymentId === m.id && <CheckCircle2 className="w-4 h-4 text-sakura shrink-0" />}
                            </div>
                            <div className="w-full pt-3 border-t border-white/5 text-left">
                               <p className="text-[11px] font-black text-zinc-400">Total: <span className="text-sakura">Rp {((calc.subtotal - discount) + m.fee).toLocaleString('id-ID')}</span></p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: RINGKASAN & KUPON (LEBAR 4 - STICKY) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            
            {/* TIKET KUPON PROMO (Gaya Gambar 3) */}
            <div className="glass-elite rounded-[2rem] p-6 relative overflow-hidden border border-sakura/20 shadow-[0_10px_30px_rgba(253,176,192,0.1)]">
              {/* Lubang Perforated Kiri Kanan */}
              <div className="absolute top-1/2 left-[-12px] -translate-y-1/2 w-6 h-6 bg-zinc-950 rounded-full border-r border-white/10 z-10" />
              <div className="absolute top-1/2 right-[-12px] -translate-y-1/2 w-6 h-6 bg-zinc-950 rounded-full border-l border-white/10 z-10" />
              
              <div className="flex items-center gap-3 mb-4">
                <Ticket className="w-5 h-5 text-sakura" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Lebih Hemat Pakai Promo</h3>
              </div>

              {/* Banner Promo Kecil di Dalam Tiket */}
              <div className="bg-gradient-to-r from-sakura/20 to-transparent p-4 rounded-xl border border-sakura/20 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-sakura">1<span className="text-xl">%</span></div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Kode Promo Diskon</p>
                    <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Berlaku s/d 30 Apr</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input 
                  type="text" placeholder="Masukkan kode promo.." 
                  value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold uppercase focus:border-sakura outline-none"
                />
                <button type="submit" className="bg-zinc-800 text-white font-black text-[10px] uppercase px-4 py-3 rounded-xl hover:bg-sakura hover:text-zinc-950 transition-colors">Gunakan</button>
              </form>
            </div>

            {/* RINGKASAN CHECKOUT */}
            <div className="glass-elite p-8 rounded-[2.5rem] border-t-4 border-t-sakura space-y-6 relative shadow-2xl">
              <div className="text-center pb-6 border-b border-white/5">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Ringkasan Pesanan</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase tracking-widest">ID Player</span><span className="text-white font-mono font-black">{formData.userId || "-"}</span></div>
                <div className="flex justify-between items-start text-xs"><span className="text-zinc-500 font-bold uppercase tracking-widest">Produk</span><span className="text-white text-right max-w-[150px] font-black uppercase tracking-tight">{calc.name || "-"}</span></div>
                <div className="flex justify-between items-center text-xs"><span className="text-zinc-500 font-bold uppercase tracking-widest">Metode</span><span className="text-sakura font-black uppercase">{formData.paymentId || "-"}</span></div>

                <div className="pt-5 border-t border-dashed border-white/10 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest"><span>Subtotal</span><span>Rp {calc.subtotal.toLocaleString('id-ID')}</span></div>
                  {discount > 0 && <div className="flex justify-between text-[10px] font-bold text-green-400 uppercase tracking-widest"><span>Diskon Promo</span><span>-Rp {discount.toLocaleString('id-ID')}</span></div>}
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest"><span>Admin Fee</span><span>Rp {calc.fee.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-xs font-black text-white uppercase tracking-widest mb-1">Total</span>
                    <span className="text-3xl font-black text-sakura tracking-tighter drop-shadow-[0_0_15px_rgba(253,176,192,0.4)]">
                      Rp {calc.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit" disabled={!isFormValid || isSubmitting}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 group
                  ${isFormValid ? "bg-sakura text-zinc-950 hover:bg-white hover:scale-[1.02] shadow-[0_15px_40px_rgba(253,176,192,0.3)]" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Konfirmasi Pesanan <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" /></>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}