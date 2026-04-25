"use client";

import { useState, useEffect } from "react";

// 🎨 KAMUS VISUAL & KATEGORI GAME
const GAME_VISUALS: Record<string, { cover: string, banner: string, type: string }> = {
  "mobile-legends": {
    type: "Mobile",
    cover: "https://i.pinimg.com/originals/e8/38/2d/e8382d2c140409a80e461bd516f4dbd9.jpg",
    banner: "https://images.hdqwalls.com/download/mobile-legends-bang-bang-5k-9q-1280x400.jpg"
  },
  "free-fire": {
    type: "Mobile",
    cover: "https://i.pinimg.com/736x/8f/c9/76/8fc976ab94ea26402ecf048d2d667c13.jpg",
    banner: "https://images.hdqwalls.com/download/garena-free-fire-2021-3a-1280x400.jpg"
  },
  "valorant": {
    type: "PC",
    cover: "https://i.pinimg.com/736x/01/f9/ba/01f9ba010b9eb020ab1609121a5cfb07.jpg",
    banner: "https://images.hdqwalls.com/download/valorant-game-2020-4k-pf-1280x400.jpg"
  },
  "genshin": {
    type: "Mobile",
    cover: "https://i.pinimg.com/736x/7d/cc/43/7dcc43c17800c732fc016ba84c424076.jpg",
    banner: "https://images.hdqwalls.com/download/genshin-impact-4k-2020-0a-1280x400.jpg"
  },
  "default": {
    type: "Lainnya",
    cover: "https://placehold.co/300x400/1a2235/ec4899?text=GAME",
    banner: "https://placehold.co/1200x400/0d111a/ec4899?text=SASSYGURL+STORE"
  }
};

// DATA PROMO BANNER (Bisa ditambah)
const PROMOS = [
  { id: 1, img: "https://placehold.co/1200x300/1e102c/ec4899?text=🔥+FLASH+SALE+MOBILE+LEGENDS", color: "#1e102c" },
  { id: 2, img: "https://placehold.co/1200x300/0f172a/38bdf8?text=💎+BONUS+TOP+UP+GENSHIN", color: "#0f172a" },
  { id: 3, img: "https://placehold.co/1200x300/3f0713/f43f5e?text=🔫+VALORANT+CASHBACK+20%", color: "#3f0713" },
];

export default function StoreFront({ categories }: { categories: any[] }) {
  const [mounted, setMounted] = useState(false);
  
  // State Navigasi
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");
  const [currentSlide, setCurrentSlide] = useState(0);

  // State Transaksi
  const [selectedProd, setSelectedProd] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("qris");
  const [form, setForm] = useState({ userId: "", zoneId: "", wa: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Auto Slider Effect
  useEffect(() => {
    setMounted(true);
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PROMOS.length);
    }, 4000); // Ganti gambar tiap 4 detik
    return () => clearInterval(slideInterval);
  }, []);

  const handleNumericInput = (val: string, field: string) => {
    const numericValue = val.replace(/[^0-9]/g, "");
    setForm(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleOrder = async () => {
    if (!form.userId || !selectedProd || !form.wa) {
      return alert("Mohon lengkapi data User ID, Nominal, dan WhatsApp bosku!");
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId, zoneId: form.zoneId, wa: form.wa, 
          productId: selectedProd.id, paymentMethod: paymentMethod
        }),
      });
      const data = await response.json();
      if (data.success) {
        const myNumber = "6289506094169";
        const msg = `Halo Admin SassyGurlStore! 👋\nSaya ingin melakukan pembayaran untuk pesanan saya.\n\n🧾 *DETAIL INVOICE*\n▪️ No. Invoice: ${data.invoiceId}\n▪️ Status: ⏳ PENDING\n\n🎮 *DETAIL PESANAN*\n▪️ Game: ${selectedGame.name}\n▪️ Item: ${data.productName}\n▪️ ID Tujuan: ${form.userId}${form.zoneId ? ` (${form.zoneId})` : ""}\n\n💳 *INFO PEMBAYARAN*\n▪️ Metode: ${paymentMethod.toUpperCase()}\n▪️ WA Kontak: ${form.wa}\n\nBoleh minta detail pembayarannya min? Biar langsung saya transfer! ✨`;
        window.open(`https://wa.me/${myNumber}?text=${encodeURIComponent(msg)}`);
      } else {
        alert("Gagal membuat pesanan: " + data.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan saat memproses pesanan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  // Filter Logika Pencarian & Tab
  const filteredCategories = categories.filter(cat => {
    const visual = GAME_VISUALS[cat.slug] || GAME_VISUALS["default"];
    const matchSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === "Semua" || visual.type === activeTab;
    return matchSearch && matchTab;
  });

  const currentVisual = selectedGame ? (GAME_VISUALS[selectedGame.slug] || GAME_VISUALS["default"]) : GAME_VISUALS["default"];

  // ==========================================
  // TAMPILAN HOMEPAGE (DITUSI-STYLE)
  // ==========================================
  if (!selectedGame) {
    return (
      <div className="container" suppressHydrationWarning style={{ marginTop: '2rem' }}>
        
        {/* PROMO SLIDER CAROUSEL */}
        <div style={{ position: 'relative', width: '100%', height: '250px', borderRadius: '24px', overflow: 'hidden', marginBottom: '3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          {PROMOS.map((promo, index) => (
            <div key={promo.id} style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              backgroundImage: `url(${promo.img})`,
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}></div>
          ))}
          {/* Slider Dots */}
          <div style={{ position: 'absolute', bottom: '15px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {PROMOS.map((_, i) => (
              <div key={i} style={{ width: currentSlide === i ? '24px' : '8px', height: '8px', borderRadius: '4px', background: currentSlide === i ? 'var(--primary)' : 'rgba(255,255,255,0.3)', transition: '0.3s' }}></div>
            ))}
          </div>
        </div>
        
        {/* FILTER & SEARCH BAR */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-card)', padding: '5px', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
            {["Semua", "Mobile", "PC"].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', transition: '0.3s' }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <input 
              type="text" 
              placeholder="🔍 Cari game kesayanganmu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 20px', borderRadius: '14px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'white', outline: 'none' }}
            />
          </div>
        </div>

        {/* GAME GRID */}
        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Game tidak ditemukan.</div>
        ) : (
          <div className="game-grid">
            {filteredCategories.map(cat => {
              const visual = GAME_VISUALS[cat.slug] || GAME_VISUALS["default"];
              return (
                <div key={cat.id} className="game-card" onClick={() => setSelectedGame(cat)}>
                  <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
                    <img src={visual.cover} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                    {/* Hot Badge */}
                    {['mobile-legends', 'free-fire'].includes(cat.slug) && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 900, padding: '4px 8px', borderRadius: '6px', boxShadow: '0 2px 10px rgba(239,68,68,0.5)' }}>HOT</div>
                    )}
                  </div>
                  <div className="game-title">{cat.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAMPILAN DETAIL PAGE (FORM CHECKOUT)
  // ==========================================
  return (
    <>
      <div style={{
        width: '100%', height: '350px', backgroundImage: `linear-gradient(to bottom, rgba(5, 5, 10, 0.2), rgba(5, 5, 10, 1)), url(${currentVisual.banner})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', top: 0, left: 0, zIndex: -1, opacity: 0.8
      }}></div>

      <div className="container detail-layout" suppressHydrationWarning style={{ marginTop: '80px' }}>
        
        {/* KIRI: PROFIL GAME */}
        <aside>
          <div className="profile-card" style={{ background: 'rgba(13, 17, 26, 0.6)', backdropFilter: 'blur(20px)' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '24px', overflow: 'hidden', border: '3px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <img src={currentVisual.cover} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 className="profile-title">{selectedGame.name}</h1>
            <p className="profile-dev">✨ Verified Instant Delivery</p>
            <div className="profile-desc">
              Layanan Top Up {selectedGame.name} 24 Jam Non-Stop. Proses kilat langsung masuk ke akun tanpa antri.
            </div>
            
            <button 
              onClick={() => { setSelectedGame(null); setSelectedProd(null); }} 
              style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, transition: '0.3s' }}
            >
              ← Ganti Game
            </button>
          </div>
        </aside>

        {/* KANAN: FORM & NOMINAL */}
        <section>
          
          {/* STEP 1 */}
          <div className="step-card" style={{ background: 'rgba(13, 17, 26, 0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="step-header">
              <div className="step-num">1</div>
              <h2 className="step-title">Lengkapi Data Tujuan</h2>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>{selectedGame.slug === 'valorant' ? 'Riot ID' : 'User ID'}</label>
                <input className="input-control" value={form.userId} placeholder="Ketik ID Anda" onChange={e => {
                  if (['mobile-legends', 'free-fire'].includes(selectedGame.slug)) handleNumericInput(e.target.value, 'userId');
                  else setForm({...form, userId: e.target.value});
                }} />
              </div>
              {['mobile-legends', 'genshin'].includes(selectedGame.slug) && (
                <div className="input-group">
                  <label>{selectedGame.slug === 'genshin' ? 'Server' : 'Zone ID'}</label>
                  <input className="input-control" value={form.zoneId} placeholder={selectedGame.slug === 'genshin' ? 'Asia' : '1234'} onChange={e => {
                    if (selectedGame.slug === 'mobile-legends') handleNumericInput(e.target.value, 'zoneId');
                    else setForm({...form, zoneId: e.target.value});
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: GRID NOMINAL DENGAN BADGE */}
          <div className="step-card" style={{ background: 'rgba(13, 17, 26, 0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="step-header">
              <div className="step-num">2</div>
              <h2 className="step-title">Pilih Nominal Top Up</h2>
            </div>
            <div className="nominal-grid">
              {selectedGame.products.map((p: any, index: number) => (
                <div 
                  key={p.id} 
                  className={`nominal-box ${selectedProd?.id === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedProd(p)}
                  style={{ position: 'relative' }}
                >
                  {/* Badge Promo untuk produk termurah/pertama */}
                  {index === 0 && <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#3b82f6', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>TERMURAH</div>}
                  {index === 1 && <div style={{ position: 'absolute', top: '-10px', left: '10px', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>BANYAK DIBELI</div>}
                  
                  <span className="nom-name" style={{ marginTop: '5px' }}>{p.name}</span>
                  <span className="nom-price">Rp {p.priceSell.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3 */}
          <div className="step-card" style={{ background: 'rgba(13, 17, 26, 0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="step-header">
              <div className="step-num">3</div>
              <h2 className="step-title">Metode Pembayaran</h2>
            </div>
            <div className="pay-group">
              <div className="pay-group-title">E-Wallet & Scan</div>
              <div className="pay-items">
                {['QRIS (Bebas Biaya)', 'DANA', 'GoPay', 'OVO'].map(method => (
                  <div key={method} className={`pay-item ${paymentMethod === method.toLowerCase() ? 'active' : ''}`} onClick={() => setPaymentMethod(method.toLowerCase())}>
                    <span className="pay-name">{method.includes('QRIS') ? '⚡' : '💳'} {method}</span>
                    <span className="pay-price">{selectedProd ? `Rp ${selectedProd.priceSell.toLocaleString('id-ID')}` : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="step-card" style={{ background: 'rgba(13, 17, 26, 0.8)', backdropFilter: 'blur(10px)' }}>
            <div className="step-header">
              <div className="step-num">4</div>
              <h2 className="step-title">Detail Kontak & Bayar</h2>
            </div>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label>Nomor WhatsApp (Wajib)</label>
              <input className="input-control" placeholder="0895xxxxxxxx" value={form.wa} onChange={e => handleNumericInput(e.target.value, 'wa')} style={{ fontSize: '1.2rem', padding: '18px' }} />
            </div>
            <button className="btn-buy" onClick={handleOrder} disabled={!selectedProd || !form.userId || isLoading}>
              {isLoading ? 'MEMPROSES TRANSAKSI...' : (
                <>BAYAR SEKARANG {selectedProd && `• Rp ${selectedProd.priceSell.toLocaleString('id-ID')}`}</>
              )}
            </button>
          </div>

        </section>
      </div>
    </>
  );
}