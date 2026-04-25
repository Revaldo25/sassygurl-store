"use client";
import { useRef, useState } from "react";

export default function BannerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = [
    {
      title: "WELKIN MOON", subtitle: "Promo Cashback Spesial",
      desc: "Top Up Genshin Impact sekarang dan dapatkan bonus langsung.",
      bg: "bg-[#1E1B2E]", // Background warna padat yang elegan
      img: "https://i.pinimg.com/736x/48/84/02/4884022a1ce0a516bb59f20eeb7662c5.jpg"
    },
    {
      title: "VALORANT", subtitle: "Night Market Update",
      desc: "Diskon VP untuk borong skin incaranmu.",
      bg: "bg-[#0F172A]",
      img: "https://i.pinimg.com/736x/21/be/16/21be16010bd1e43e2f1f51da461ba007.jpg"
    }
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPos = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      setActiveIndex(Math.round(scrollPos / width));
    }
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: index * scrollRef.current.offsetWidth, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full aspect-[21/9] md:aspect-[24/7]"
      >
        {banners.map((b, i) => (
          <div key={i} className={`snap-center relative w-full h-full flex-shrink-0 ${b.bg} flex items-center p-6 md:p-12`}>
            <div className="relative z-10 w-2/3 md:w-1/2">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-1">{b.title}</h2>
              <p className="text-sm md:text-base font-bold text-[var(--sakura)] mb-3">{b.subtitle}</p>
              <p className="text-xs text-[var(--text-muted)] mb-6 hidden md:block max-w-sm">{b.desc}</p>
              <button className="bg-[var(--sakura)] text-[#09090b] px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[var(--sakura-hover)] transition-colors">Cek Promo</button>
            </div>
            {/* Masking gambar agar transisinya halus ke background */}
            <div className="absolute right-0 top-0 h-full w-1/2 md:w-1/3">
               <div className={`absolute inset-0 bg-gradient-to-r ${b.bg.replace('bg-', 'from-')} to-transparent z-10`}></div>
               <img src={b.img} className="h-full w-full object-cover object-center" alt="Banner" />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, i) => (
          <button 
            key={i} onClick={() => scrollTo(i)}
            className={`transition-all duration-300 rounded-full h-1.5 ${activeIndex === i ? "w-6 bg-[var(--sakura)]" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}