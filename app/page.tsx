import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Gamepad2, Search, Flame, Zap, ShieldCheck, 
  Clock, ChevronRight, Star, ArrowRight, MessageCircleQuestion,
  Trophy, Gem, Sparkles
} from "lucide-react";
import { prisma } from "@/lib/prisma";

// ============================================================================
// 1. DATA FETCHING (SERVER-SIDE)
// ============================================================================

async function getHomePageData() {
  // Dalam production, ini memanggil database beneran (Prisma).
  // Karena ini template Masterpiece, kita siapkan struktur Mock Data yang identik 
  // dengan output Prisma agar tidak error saat database belum penuh.
  
  const flashSaleEnds = new Date(Date.now() + 1000 * 60 * 60 * 5); // 5 Jam dari sekarang

  return {
    liveTransactions: [
      { id: 1, user: "Sultan***99", game: "Mobile Legends", item: "86 Diamonds", time: "Baru saja" },
      { id: 2, user: "ProPlay***X", game: "Valorant", item: "1120 VP", time: "1 menit lalu" },
      { id: 3, user: "Genshin***Lvr", game: "Genshin Impact", item: "Welkin Moon", time: "3 menit lalu" },
      { id: 4, user: "Budi***77", game: "Free Fire", item: "140 Diamonds", time: "5 menit lalu" },
    ],
    categories: ["Semua", "Mobile Games", "PC Games", "Voucher", "Entertainment"],
    flashSales: [
      { id: "mlbb-fs", name: "Mobile Legends", item: "86 Diamonds", price: 19500, promoPrice: 17000, stock: 100, sold: 85, img: "https://placehold.co/400x400/09090b/FDB0C0?text=MLBB" },
      { id: "gi-fs", name: "Genshin Impact", item: "Welkin Moon", price: 79000, promoPrice: 65000, stock: 50, sold: 48, img: "https://placehold.co/400x400/09090b/FDB0C0?text=GENSHIN" },
      { id: "val-fs", name: "Valorant", item: "420 VP", price: 49000, promoPrice: 42000, stock: 200, sold: 120, img: "https://placehold.co/400x400/09090b/FDB0C0?text=VALORANT" },
    ],
    games: [
      { id: "mlbb", name: "Mobile Legends", category: "Mobile Games", minPrice: 3000, isHot: true, img: "https://placehold.co/400x400/18181b/ffffff?text=MLBB" },
      { id: "genshin", name: "Genshin Impact", category: "Mobile/PC", minPrice: 16500, isHot: true, img: "https://placehold.co/400x400/18181b/ffffff?text=GENSHIN" },
      { id: "pubgm", name: "PUBG Mobile", category: "Mobile Games", minPrice: 15000, isHot: false, img: "https://placehold.co/400x400/18181b/ffffff?text=PUBG" },
      { id: "ff", name: "Free Fire", category: "Mobile Games", minPrice: 1000, isHot: true, img: "https://placehold.co/400x400/18181b/ffffff?text=FF" },
      { id: "valo", name: "Valorant", category: "PC Games", minPrice: 14500, isHot: true, img: "https://placehold.co/400x400/18181b/ffffff?text=VALO" },
      { id: "hsr", name: "Honkai Star Rail", category: "Mobile/PC", minPrice: 16500, isHot: false, img: "https://placehold.co/400x400/18181b/ffffff?text=HSR" },
      { id: "rob", name: "Roblox", category: "Entertainment", minPrice: 15000, isHot: false, img: "https://placehold.co/400x400/18181b/ffffff?text=ROBLOX" },
      { id: "steam", name: "Steam Wallet", category: "Voucher", minPrice: 12000, isHot: false, img: "https://placehold.co/400x400/18181b/ffffff?text=STEAM" },
    ],
    reviews: [
      { user: "Riyan", rating: 5, text: "Gila cepet banget! Baru transfer, sedetik kemudian diamond ML udah masuk." },
      { user: "Siska", rating: 5, text: "Website paling elegan yang pernah gue liat buat topup. Admin responsif." },
      { user: "Kevin", rating: 5, text: "Harga Welkin paling murah se-Pontianak. Mantap Bosku!" },
      { user: "Dina", rating: 4, text: "Aman dan terpercaya, udah langganan VIP di sini." },
    ],
    faqs: [
      { q: "Berapa lama proses Top-Up?", a: "Proses transaksi kami 100% otomatis. Hanya butuh 1-3 detik setelah pembayaran berhasil dikonfirmasi oleh sistem." },
      { q: "Metode pembayaran apa saja yang tersedia?", a: "Kami mendukung QRIS (Otomatis), Virtual Account (BCA, BNI, Mandiri, BRI), E-Wallet (GoPay, DANA, OVO, ShopeePay), dan Gerai Retail (Alfamart/Indomaret)." },
      { q: "Apakah aman akun saya?", a: "Sangat aman. Kami hanya membutuhkan User ID dan Server ID. Kami TIDAK PERNAH meminta password atau data login Anda." },
      { q: "Bagaimana jika Top-Up belum masuk?", a: "Jika dalam 5 menit belum masuk, segera hubungi CS kami via WhatsApp dengan melampirkan Nomor Invoice. Uang Anda bergaransi 100% kembali." },
    ]
  };
}

// ============================================================================
// 2. INLINE SUB-COMPONENTS (Untuk mempertahankan konsep One-Massive-File)
// ============================================================================

const LiveTicker = ({ transactions }: { transactions: any[] }) => (
  <div className="w-full bg-sakura text-zinc-950 text-[10px] font-black uppercase tracking-widest py-2 overflow-hidden border-b border-sakura/50">
    <div className="flex animate-[shimmer_20s_linear_infinite] whitespace-nowrap">
      {[...transactions, ...transactions, ...transactions].map((tx, i) => (
        <span key={i} className="mx-4 flex items-center gap-2">
          <Zap className="w-3 h-3" />
          <span>{tx.user} BERHASIL MEMBELI {tx.item} ({tx.game}) - {tx.time}</span>
        </span>
      ))}
    </div>
  </div>
);

const HeroSection = () => (
  <section className="relative pt-24 md:pt-32 pb-20 overflow-hidden px-6">
    <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-sakura-glow pointer-events-none" />
    <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
      
      {/* Left Content */}
      <div className="space-y-8 text-center lg:text-left">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 shadow-2xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sakura opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sakura"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">
            Sistem Otomatis 24 Jam
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
          Eksklusif. <br />
          <span className="text-sakura-gradient">Secepat Kilat.</span>
        </h1>

        <p className="text-sm md:text-base text-zinc-400 font-medium tracking-wide max-w-lg mx-auto lg:mx-0 leading-relaxed">
          SassyGurlStore Elite menyediakan layanan top-up game premium dengan keamanan setara perbankan. Garansi uang kembali 100%.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
          <Link href="#katalog" className="btn-sakura w-full sm:w-auto flex justify-center items-center gap-2 text-xs tracking-widest px-8">
            TOP-UP SEKARANG <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest px-4">
            <ShieldCheck className="w-4 h-4 text-sakura" /> 100% Aman
          </div>
        </div>
      </div>

      {/* Right Content - 3D/Parallax Card Illusion */}
      <div className="relative hidden lg:block h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-tr from-sakura/20 to-transparent rounded-full blur-[80px]" />
        
        {/* Floating Card 1 */}
        <div className="absolute top-10 right-10 w-64 glass-elite p-4 rounded-3xl transform rotate-12 hover:rotate-0 transition-transform duration-700 hover:scale-110 hover:z-20 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="aspect-video bg-zinc-950 rounded-2xl overflow-hidden relative mb-3">
             <Image src="https://placehold.co/400x300/09090b/FDB0C0?text=MLBB" alt="ML" fill className="object-cover opacity-80" />
             <div className="absolute top-2 right-2 bg-sakura text-zinc-950 text-[10px] font-black px-2 py-1 rounded-lg">POPULER</div>
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">Mobile Legends</h3>
          <p className="text-[10px] text-sakura font-bold tracking-widest mt-1">Mulai Rp 3.000</p>
        </div>

        {/* Floating Card 2 */}
        <div className="absolute bottom-10 left-0 w-72 glass-elite p-5 rounded-3xl transform -rotate-6 hover:rotate-0 transition-transform duration-700 hover:scale-110 hover:z-20 cursor-pointer border-sakura/30 shadow-[0_20px_50px_rgba(253,176,192,0.1)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-sakura/10 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-sakura" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase">Welkin Moon</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Genshin Impact</p>
            </div>
          </div>
          <div className="flex justify-between items-end border-t border-white/10 pt-3">
             <span className="text-[10px] text-zinc-500 font-black uppercase">Harga Elite</span>
             <span className="text-lg font-black text-sakura">Rp 79.000</span>
          </div>
        </div>
      </div>

    </div>
  </section>
);

const FlashSaleSection = ({ items }: { items: any[] }) => (
  <section className="max-w-[1200px] mx-auto px-6 mb-24 relative z-10">
    <div className="glass-elite rounded-[2.5rem] p-6 md:p-10 border-sakura/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-sakura/10 blur-[100px] pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sakura text-zinc-950 flex items-center justify-center shadow-[0_0_30px_rgba(253,176,192,0.3)]">
            <Flame className="w-7 h-7 fill-zinc-950" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none mb-1">Flash Deal</h2>
            <p className="text-[10px] text-sakura font-black tracking-[0.2em] uppercase">Diskon Terbatas Bosku!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest hidden sm:block">Berakhir Dalam</span>
          <div className="flex gap-2">
            <div className="bg-zinc-950 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-inner">04</div>
            <span className="text-zinc-600 font-bold text-xl self-center">:</span>
            <div className="bg-zinc-950 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-inner">59</div>
            <span className="text-zinc-600 font-bold text-xl self-center">:</span>
            <div className="bg-sakura/10 border border-sakura/30 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-sakura shadow-[0_0_15px_rgba(253,176,192,0.2)] animate-pulse">22</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {items.map((item) => {
          const percentSold = Math.round((item.sold / item.stock) * 100);
          return (
            <div key={item.id} className="bg-zinc-950/50 p-5 rounded-3xl border border-white/5 hover:border-sakura/40 transition-all duration-300 group cursor-pointer relative overflow-hidden">
              {/* Promo Tag */}
              <div className="absolute top-0 right-0 bg-sakura text-zinc-950 text-[10px] font-black px-4 py-2 rounded-bl-2xl z-10">
                HEMAT {(100 - (item.promoPrice / item.price * 100)).toFixed(0)}%
              </div>
              
              <div className="flex gap-5">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10">
                  <Image src={item.img} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{item.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{item.item}</p>
                  <div className="mt-3">
                    <p className="text-[10px] text-zinc-600 line-through font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                    <p className="text-lg font-black text-sakura leading-none mt-0.5">Rp {item.promoPrice.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  <span>Terjual {item.sold}</span>
                  <span className="text-sakura">Sisa {item.stock - item.sold}</span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-sakura/50 to-sakura h-full rounded-full transition-all duration-1000" style={{ width: `${percentSold}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const GameCatalogSection = ({ categories, games }: { categories: string[], games: any[] }) => {
  // Client-side filtering logic would typically go here using useState, 
  // but for Server Component simulation, we render all for display.
  return (
    <section id="katalog" className="max-w-[1200px] mx-auto px-6 mb-32 relative z-10">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">Katalog <span className="text-sakura">Elite</span></h2>
        <p className="text-sm text-zinc-400 font-medium max-w-2xl mx-auto">Pilih dari puluhan game populer dengan jaminan harga termurah dan proses otomatis 1 detik.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((cat, idx) => (
          <button 
            key={cat}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              idx === 0 
                ? "bg-sakura text-zinc-950 shadow-[0_0_20px_rgba(253,176,192,0.3)]" 
                : "bg-zinc-900 text-zinc-400 border border-white/5 hover:border-sakura/50 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {games.map((game) => (
          <Link href={`/game/${game.id}`} key={game.id} className="group glass-elite rounded-3xl p-4 hover:-translate-y-2 transition-all duration-500 hover:border-sakura/40 block">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 mb-4 border border-white/5">
              <Image src={game.img} alt={game.name} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
              {game.isHot && (
                <div className="absolute top-2 right-2 bg-sakura/90 backdrop-blur-md text-zinc-950 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">
                  HOT
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-sakura transition-colors">{game.name}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{game.category}</p>
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Mulai Dari</span>
                <span className="text-xs font-black text-white">Rp {game.minPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const FeatureSection = () => (
  <section className="bg-zinc-900/50 border-y border-white/5 py-24 mb-24">
    <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/5">
      <div className="space-y-4 px-6">
        <div className="w-16 h-16 mx-auto bg-sakura/10 rounded-2xl flex items-center justify-center border border-sakura/20">
          <Zap className="w-8 h-8 text-sakura" />
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-tight">Proses 1 Detik</h3>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">Sistem API otomatis kami memastikan diamond Anda masuk sebelum Anda sempat berkedip.</p>
      </div>
      <div className="space-y-4 px-6 pt-12 md:pt-0">
        <div className="w-16 h-16 mx-auto bg-sakura/10 rounded-2xl flex items-center justify-center border border-sakura/20">
          <ShieldCheck className="w-8 h-8 text-sakura" />
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-tight">Legal & Aman</h3>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">Semua produk 100% legal dan resmi. Kami menjamin akun Anda bebas dari risiko banned.</p>
      </div>
      <div className="space-y-4 px-6 pt-12 md:pt-0">
        <div className="w-16 h-16 mx-auto bg-sakura/10 rounded-2xl flex items-center justify-center border border-sakura/20">
          <Gem className="w-8 h-8 text-sakura" />
        </div>
        <h3 className="text-lg font-black text-white uppercase tracking-tight">Harga Reseller</h3>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">Nikmati harga tangan pertama tanpa harus menjadi VIP. Murah setiap saat, tanpa syarat.</p>
      </div>
    </div>
  </section>
);

const TestimonialSection = ({ reviews }: { reviews: any[] }) => (
  <section className="max-w-[1200px] mx-auto px-6 mb-32 overflow-hidden">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-3">Kata <span className="text-sakura">Sultan</span></h2>
      <p className="text-sm text-zinc-400 font-medium">Ribuan transaksi sukses setiap harinya.</p>
    </div>
    
    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x">
      {reviews.map((rev, i) => (
        <div key={i} className="min-w-[300px] glass-elite p-6 rounded-3xl snap-center shrink-0">
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, idx) => (
              <Star key={idx} className={`w-4 h-4 ${idx < rev.rating ? "fill-sakura text-sakura" : "text-zinc-700"}`} />
            ))}
          </div>
          <p className="text-sm text-zinc-300 font-medium leading-relaxed mb-6">"{rev.text}"</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-black text-white border border-white/10">
              {rev.user.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">{rev.user}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Verified Buyer</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const FAQSection = ({ faqs }: { faqs: any[] }) => (
  <section className="max-w-[800px] mx-auto px-6 mb-32 relative z-10">
    <div className="text-center mb-12">
      <div className="w-16 h-16 mx-auto bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 mb-6">
        <MessageCircleQuestion className="w-8 h-8 text-sakura" />
      </div>
      <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-3">Pertanyaan Umum</h2>
    </div>
    
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <details key={i} className="group glass-elite rounded-2xl [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-white font-bold text-sm">
            {faq.q}
            <span className="shrink-0 rounded-full bg-zinc-900 p-1.5 text-zinc-400 group-open:bg-sakura group-open:text-zinc-950 transition-colors">
              <svg className="h-4 w-4 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>
          <div className="px-6 pb-6 text-xs text-zinc-400 font-medium leading-relaxed border-t border-white/5 pt-4">
            {faq.a}
          </div>
        </details>
      ))}
    </div>
  </section>
);

// ============================================================================
// 3. MAIN PAGE COMPONENT & JSON-LD (SEO)
// ============================================================================

export default async function MegaHomePage() {
  const data = await getHomePageData();

  // SEO: Structured Data Schema.org
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SassyGurlStore Elite",
    "url": "https://sassygurlstore.com",
    "description": "Top up game paling murah dan cepat se-Indonesia.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://sassygurlstore.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col selection:bg-sakura/30">
        
        {/* Ticker (Pembelian Terkini) */}
        <LiveTicker transactions={data.liveTransactions} />

        {/* Header / Hero */}
        <HeroSection />

        {/* Flash Deals */}
        <FlashSaleSection items={data.flashSales} />

        {/* Keunggulan Kami */}
        <FeatureSection />

        {/* Katalog Utama */}
        <GameCatalogSection categories={data.categories} games={data.games} />

        {/* Testimoni */}
        <TestimonialSection reviews={data.reviews} />

        {/* FAQ */}
        <FAQSection faqs={data.faqs} />

      </main>
    </>
  );
}