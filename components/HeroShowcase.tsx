"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, PlayCircle } from "lucide-react";
import { Game, formatIDR } from "@/lib/catalog";

type Props = {
  game: Game;
  videoSrc?: string;
};

export default function HeroShowcase({ game, videoSrc = "/media/hero-loop.mp4" }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover opacity-60"
          autoPlay
          muted
          loop
          playsInline
          poster={game.banner}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,176,192,0.18),transparent_45%),linear-gradient(180deg,rgba(9,9,11,0.35),rgba(9,9,11,0.92))]" />
      </div>

      <div className="relative mx-auto grid min-h-[82vh] max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.15fr_0.85fr] md:px-6 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col justify-end gap-6"
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sakura/30 bg-sakura/10 px-4 py-2 text-xs font-semibold tracking-[0.25em] text-sakura">
            <Sparkles className="h-4 w-4" />
            PREMIUM • FAST • SECURE
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-7xl">
              Top-Up {game.shortCode} dengan rasa <span className="text-sakura">elite</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 md:text-lg">
              {game.description} Dibangun dengan alur reactive modular, glassmorphism neon, smart routing, dan checkout melayang seperti aplikasi premium.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/mlbb" className="inline-flex items-center gap-2 rounded-full bg-sakura px-5 py-3 text-sm font-black text-zinc-950 shadow-[0_0_28px_rgba(253,176,192,0.32)] transition hover:scale-[1.02]">
              Buka MLBB Elite
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/10">
              <PlayCircle className="h-4 w-4" />
              Preview Experience
            </button>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-3 pt-2">
            {[
              ["Online Now", game.stats.online],
              ["Sold Today", game.stats.sold],
              ["Rating", game.stats.rating],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-2xl">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">{label}</p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: 18 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative flex items-end"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(253,176,192,0.28),transparent_60%)] blur-2xl" />
          <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/[0.55] shadow-[0_0_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="relative aspect-[4/5] w-full">
              <Image src={game.banner} alt={game.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image src={game.icon} alt={game.shortCode} fill className="object-cover p-1.5" />
                </div>
                <div>
                  <p className="text-xs tracking-[0.24em] text-sakura/70">FEATURED GAME</p>
                  <h2 className="text-xl font-bold text-white">{game.name}</h2>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {game.products.slice(0, 4).map((item) => {
                  const price = formatIDR(item.providerQuotes.digiflazz <= item.providerQuotes.vip ? item.providerQuotes.digiflazz : item.providerQuotes.vip);
                  return (
                    <div key={item.sku} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                      <p className="text-white/55">{item.name}</p>
                      <p className="mt-1 font-bold text-white">{price}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
