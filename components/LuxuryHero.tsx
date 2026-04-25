"use client";
export default function LuxuryHero() {
  return (
    <section className="relative h-[95vh] w-full flex flex-col items-center justify-center overflow-hidden">
      
      {/* 📹 MULTIMEDIA 1: BACKGROUND VIDEO LOOP */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="h-full w-full object-cover opacity-10 brightness-[0.3]"
        >
          {/* Ganti dengan URL video ambient gaming Anda */}
          <source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-at-night-with-neon-lights-4424-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
      </div>

      {/* 🖼️ MULTIMEDIA 2: FLOATING RENDER (IMAGE) */}
      <div className="relative z-10 text-center px-6">
        <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-6 py-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
          </span>
          <span className="text-[10px] font-black tracking-[0.4em] text-[#D4AF37] uppercase">Elite Experience</span>
        </div>

        <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] mb-8">
          TRANSAKSI <br /> <span className="bg-gradient-to-r from-white via-slate-500 to-white bg-clip-text text-transparent">ELITE</span>
        </h1>
        
        <p className="text-slate-400 max-w-xl mx-auto text-lg md:text-xl font-medium tracking-tight mb-12">
          Selamat datang di SassyGurl Elite Store. Platform top-up dengan standar kenyamanan sultan.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <button className="px-12 py-6 rounded-2xl bg-[#D4AF37] text-black font-black text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_50px_rgba(212,175,55,0.3)]">
            EXPLORE CATALOG
          </button>
          <button className="px-12 py-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs tracking-[0.2em] backdrop-blur-md hover:bg-white/10 transition-all">
            VIP ACCESS
          </button>
        </div>
      </div>
      
      {/* Visual Decor Element */}
      <div className="absolute bottom-0 w-full h-[200px] bg-gradient-to-t from-[#050505] to-transparent z-20" />
    </section>
  );
}