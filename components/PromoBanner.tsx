"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Crown, Zap, Gem, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const PROMOS = [
  {
    id: 1,
    title: "Sultan Welcome Bonus",
    subtitle: "Cashback 10% untuk Top-Up pertama Anda hari ini. Auto kaya!",
    tag: "NEW MEMBER",
    icon: Crown,
    cta: "KLAIM SEKARANG",
    link: "#",
    // Gambar background gaming HD
    image: "https://images.alphacoders.com/133/1330235.png",
    color: "from-sakura/80",
  },
  {
    id: 2,
    title: "Flash Deal Midnight",
    subtitle: "Diskon eksklusif Blessing of the Welkin Moon. Cuma malam ini.",
    tag: "LIMITED TIME",
    icon: Zap,
    cta: "CEK PROMO",
    link: "#",
    image: "https://images8.alphacoders.com/133/1338694.png",
    color: "from-purple-500/80",
  },
  {
    id: 3,
    title: "VIP Reseller Program",
    subtitle: "Harga coret untuk Anda yang ingin berbisnis Top-Up.",
    tag: "PARTNERSHIP",
    icon: Gem,
    cta: "GABUNG VIP",
    link: "#",
    image: "https://images.alphacoders.com/131/1313745.jpeg",
    color: "from-zinc-500/80",
  },
];

export default function PromoBanner() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-slide setiap 6 detik
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [current]);

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % PROMOS.length);
      setIsAnimating(false);
    }, 300); // Waktu transisi antar slide
  };

  const handleDotClick = (idx: number) => {
    if (idx === current) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsAnimating(false);
    }, 300);
  };

  const ActivePromo = PROMOS[current];
  const Icon = ActivePromo.icon;

  return (
    <section className="px-6 mb-24 max-w-[1200px] mx-auto w-full relative z-10">
      
      {/* INJECT CSS ANIMASI KHUSUS BANNER INI SAJA */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes kenBurns {
          0% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressLine {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-ken-burns { animation: kenBurns 6s ease-out forwards; }
        .animate-slide-up { animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-progress { animation: progressLine 6s linear forwards; }
      `}} />

      <div className="rounded-[2.5rem] overflow-hidden relative h-[350px] md:h-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group">
        
        {/* BACKGROUND IMAGE DENGAN EFEK KEN BURNS (ZOOM OUT PELAN) */}
        <div key={`bg-${current}`} className="absolute inset-0 animate-ken-burns">
          <Image 
            src={ActivePromo.image} 
            alt={ActivePromo.title} 
            fill 
            className="object-cover"
            priority
          />
        </div>

        {/* OVERLAY GRADIENT AGAR TEKS TETAP TERBACA */}
        <div className={`absolute inset-0 bg-gradient-to-r ${ActivePromo.color} to-transparent opacity-40 mix-blend-multiply`} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-3/4" />

        {/* CONTENT BANNER (RE-RENDER SAAT CURRENT BERUBAH AGAR ANIMASI JALAN LAGI) */}
        <div 
          key={`content-${current}`} 
          className={`relative h-full flex items-center px-8 md:px-14 transition-opacity duration-300 ${isAnimating ? "opacity-0" : "opacity-100"}`}
        >
          <div className="flex-1 space-y-6 max-w-2xl">
            
            {/* Tag Badge */}
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/50 backdrop-blur-md border border-white/20 shadow-lg">
                <Icon className="w-4 h-4 text-sakura drop-shadow-[0_0_5px_rgba(253,176,192,0.8)]" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {ActivePromo.tag}
                </span>
              </div>
            </div>
            
            {/* Teks Utama */}
            <div className="space-y-3">
              <h2 className="animate-slide-up text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]" style={{ animationDelay: "0.2s" }}>
                {ActivePromo.title}
              </h2>
              <p className="animate-slide-up text-sm md:text-base text-zinc-300 font-medium tracking-wide max-w-lg leading-relaxed" style={{ animationDelay: "0.3s" }}>
                {ActivePromo.subtitle}
              </p>
            </div>
            
            {/* Tombol CTA */}
            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <Link 
                href={ActivePromo.link}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-zinc-950 hover:bg-sakura font-black text-xs uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                {ActivePromo.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR & DOTS (STORY INSTAGRAM STYLE) */}
        <div className="absolute bottom-6 right-8 md:right-14 left-8 md:left-14 flex items-center justify-end gap-3 z-20">
          {PROMOS.map((_, idx) => (
            <div 
              key={idx}
              onClick={() => handleDotClick(idx)}
              className="h-1.5 rounded-full bg-white/20 overflow-hidden cursor-pointer flex-1 max-w-[60px] backdrop-blur-sm"
            >
              {idx === current && (
                <div key={`progress-${current}`} className="h-full bg-sakura animate-progress shadow-[0_0_10px_rgba(253,176,192,0.8)]" />
              )}
            </div>
          ))}
        </div>

        {/* EFEK KILAU (SPARKLES) DI POJOK */}
        <Sparkles className="absolute top-10 right-10 w-12 h-12 text-white/10 animate-pulse" />

      </div>
    </section>
  );
}