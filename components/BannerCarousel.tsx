"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, PlayCircle } from "lucide-react";

const banners = [
  {
    id: 1,
    src: "/images/hero/hero_anime_duo_action.webp",
    title: "Zenless Zone Zero Exclusive",
    game: "ZZZ",
    slug: "zenless-zone-zero",
    subtitle: "Top up Monochrome tanpa biaya admin tersembunyi.",
  },
  {
    id: 2,
    src: "/images/hero/hero_genshin_fantasy_battle.webp",
    title: "Wuthering Waves Premium Top-Up",
    game: "Wuthering Waves",
    slug: "wuthering-waves",
    subtitle: "Dapatkan Lunites dengan rute termurah otomatis.",
  },
  {
    id: 3,
    src: "/images/hero/hero_sci_fi_team_banner.webp",
    title: "Honkai Star Rail Premium Top-Up",
    game: "HSR",
    slug: "honkai-star-rail",
    subtitle: "Top up Oneiric Shards dengan harga terbaik.",
  }
];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = banners[currentIndex];

  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {/* ═══ Background Layer — z-0 ═══ */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={banner.src}
              alt={banner.title}
              fill
              className="object-cover opacity-50"
              priority
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradient overlay — anti-nimpak: ensures text at bottom is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
        {/* Radial sakura glow at top */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,176,192,0.18),transparent_45%)]" />
      </div>

      {/* ═══ Content Layer — z-10 ═══ */}
      <div className="relative z-10 mx-auto grid min-h-[82vh] max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.15fr_0.85fr] md:px-6 md:py-20">
        <div className="flex flex-col justify-end gap-6 relative">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sakura/30 bg-sakura/10 px-4 py-2 text-xs font-semibold tracking-[0.25em] text-sakura backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
            PREMIUM • FAST • SECURE
          </div>

          <div className="max-w-3xl min-h-[160px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-7xl">
                  {banner.title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 md:text-lg">
                  {banner.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/game/${banner.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-sakura px-5 py-3 text-sm font-black text-zinc-950 shadow-[0_0_28px_rgba(253,176,192,0.32)] transition hover:scale-[1.02]"
            >
              Buka {banner.game} Elite
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#catalog"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/10"
            >
              <PlayCircle className="h-4 w-4" />
              Explore More Games
            </Link>
          </div>
          
          <div className="flex gap-2 mt-4">
             {banners.map((b, idx) => (
                <button 
                  key={b.id} 
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === idx ? "w-8 bg-sakura" : "w-4 bg-white/20 hover:bg-white/40"}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
             ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: 18 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative hidden md:flex items-end"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(253,176,192,0.28),transparent_60%)] blur-2xl" />
          <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/[0.55] shadow-[0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <AnimatePresence mode="wait">
              <motion.div key={banner.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="relative aspect-[4/5] w-full">
                <Image src={banner.src} alt={banner.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-xs tracking-[0.24em] text-sakura/70">FEATURED</p>
                  <h2 className="text-xl font-bold text-white uppercase">{banner.game}</h2>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}