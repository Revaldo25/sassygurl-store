"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Flame, Gamepad2, Star } from "lucide-react";
import { NormalizedGame } from "@/lib/api-adapter";

type Props = {
  games: NormalizedGame[];
  accent?: string;
};

export default function GameCatalogClient({ games, accent = "#FDB0C0" }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("SEMUA");

  const categories = ["SEMUA", "POPULER", "MOBILE", "PC"];

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSearch = (game.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                            (game.shortCode?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (activeTab === "SEMUA") return true;
      if (activeTab === "POPULER") return game.isHot;
      
      const isMobile = ["mlbb", "genshin", "pubg", "ff", "hsr", "zzz", "wuwa", "hok", "mccg"].includes(game.slug);
      if (activeTab === "MOBILE") return isMobile;
      if (activeTab === "PC") return !isMobile;

      return true;
    });
  }, [games, searchQuery, activeTab]);

  return (
    <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-16">
      {/* ── Search & Filter Bar ───────────────────────── */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:pb-0 p-1.5 rounded-2xl bg-obsidian-surface/60 border border-obsidian-border backdrop-blur-md w-max" role="tablist">
          {categories.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                aria-selected={isActive}
                className={[
                  "shrink-0 rounded-xl px-6 py-2.5 text-[11px] font-bold tracking-[0.1em] transition-all duration-300",
                  isActive
                    ? "bg-white/10 text-sakura shadow-[0_0_15px_rgba(253,176,192,0.15)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.02]"
                ].join(" ")}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sakura/20 to-royal/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
          <div className="relative flex items-center bg-obsidian-surface/80 rounded-2xl border border-obsidian-border backdrop-blur-md">
            <div className="pointer-events-none flex items-center pl-4">
              <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-sakura transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Cari game eksklusif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari game"
              className="w-full bg-transparent py-3 pl-3 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none font-semibold"
            />
          </div>
        </div>
      </div>

      {/* ── Game Grid (Boutique Style) ─────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        {filteredGames.map((game, idx) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="group glass-card overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-2 hover:border-sakura/30 hover:shadow-[0_20px_40px_-15px_rgba(253,176,192,0.2)]"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Image Container (Banner 16:9) */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-obsidian">
              <Image
                src={game.banner || game.coverImage || "/images/fallbacks/game-default.webp"}
                alt={game.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Glowing Aura on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-sakura-glow mix-blend-screen transition-opacity duration-500" />

              {/* Badges */}
              <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
                {game.isHot && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-[9px] font-bold tracking-wider text-rose-400 backdrop-blur-md shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                    <Flame className="h-3 w-3" />
                    HOT
                  </span>
                )}
              </div>

              {/* Info Container over Image */}
              <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                {/* Subtle top border in info section */}
                <div className="h-[1px] w-8 bg-white/20 mb-3 group-hover:bg-sakura/50 transition-colors" />
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white group-hover:text-glow-sakura transition-all duration-300">
                  {game.name}
                </h3>
                <p className="mt-1.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-sakura transition-colors">
                  {game.currencyName}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[2rem] glass-panel py-24 text-center mt-8 animate-fade-in-up">
          <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Star className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Katalog Tidak Ditemukan</h3>
          <p className="mt-2 text-sm text-zinc-500 font-medium">Layanan eksklusif yang Anda cari belum tersedia.</p>
        </div>
      )}
    </section>
  );
}
