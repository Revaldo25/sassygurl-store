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
    let timer: ReturnType<typeof setInterval>;

    const startInterval = () => {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        startInterval();
      }
    };

    startInterval();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const banner = banners[currentIndex];

  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {/* ═══ Background Layer — z-0 ═══ */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={banner.src}
              alt={banner.title}
              fill
              sizes="100vw"
              className="object-cover opacity-50"
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
        {/* Radial sakura glow at top */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,176,192,0.18),transparent_45%)]" />
      </div>

      {/* ═══ Content Layer — z-10 ═══ */}
      <div className="relative z-10 mx-auto flex min-h-[40vh] md:min-h-[50vh] max-w-7xl flex-col justify-end gap-6 px-4 py-10 md:px-6 md:py-12">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sakura/30 bg-sakura/10 px-4 py-2 text-xs font-semibold tracking-[0.25em] text-sakura backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          PREMIUM • FAST • SECURE
        </div>

        <div className="max-w-3xl min-h-[140px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                {banner.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                {banner.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/games/${banner.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-sakura px-5 py-3 text-sm font-black text-zinc-950 shadow-[0_0_28px_rgba(253,176,192,0.32)] transition hover:scale-[1.02]"
          >
            Buka {banner.game} Elite
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#catalog"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 backdrop-blur-sm transition hover:bg-white/10"
          >
            <PlayCircle className="h-4 w-4" />
            Explore More Games
          </Link>
        </div>
        
        <div className="flex gap-2 mt-2">
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
    </section>
  );
}