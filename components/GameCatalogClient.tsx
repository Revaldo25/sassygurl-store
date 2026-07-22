"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Flame, Gamepad2, Star } from "lucide-react";
import { NormalizedGame } from "@/lib/api-adapter";

type Props = {
  games: NormalizedGame[];
  accent?: string;
  flashSaleGameIds?: string[];
};

export default function GameCatalogClient({ games = [], flashSaleGameIds = [] }: { games: any[], flashSaleGameIds?: string[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("SEMUA");

  const categoryCounts = useMemo(() => {
    let populer = 0;
    let mobile = 0;
    let pc = 0;
    
    games.forEach(game => {
      if (game.isHot) populer++;
      const isMobile = ["mlbb", "genshin", "pubg", "ff", "hsr", "zzz", "wuwa", "hok", "mccg"].includes(game.slug);
      if (isMobile) mobile++;
      else pc++;
    });

    return {
      SEMUA: games.length,
      POPULER: populer,
      MOBILE: mobile,
      PC: pc
    };
  }, [games]);

  const categories = [
    { id: "SEMUA", label: `SEMUA (${categoryCounts.SEMUA})` },
    { id: "POPULER", label: `POPULER (${categoryCounts.POPULER})` },
    { id: "MOBILE", label: `MOBILE (${categoryCounts.MOBILE})` },
    { id: "PC", label: `PC (${categoryCounts.PC})` }
  ];

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
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar md:pb-0 p-1.5 rounded-2xl bg-obsidian-surface/60 border border-obsidian-border backdrop-blur-md w-max" role="tablist">
          {categories.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={isActive}
                className={[
                  "shrink-0 rounded-xl px-6 py-2.5 text-[11px] font-bold tracking-[0.1em] transition-all duration-300",
                  isActive
                    ? "bg-white/10 text-sakura shadow-[0_0_15px_rgba(253,176,192,0.15)]"
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.02]"
                ].join(" ")}
              >
                {tab.label}
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

      {/* ── Game Grid (Boutique Style / App Grid) ─────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        {filteredGames.map((game, idx) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="group glass-card overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-3 hover:scale-105 hover:border-sakura/50 hover:shadow-[0_0_40px_rgba(253,176,192,0.4)] relative"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Image Container (Square App Icon Style) */}
            <div className="relative aspect-square w-full overflow-hidden bg-obsidian rounded-t-xl md:rounded-none">
              <Image
                src={game.coverImage || game.banner || "/images/fallbacks/game-default.webp"}
                alt={game.name}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                className="object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-3"
              />
              
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent z-10" />
                
              {/* Hot/Flash Sale Badges */}
              <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                {game.isHot && (
                  <span className="bg-rose-500/90 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-rose-500/20">
                    HOT
                  </span>
                )}
                {flashSaleGameIds.includes(game.id) && (
                  <span className="bg-status-warning/90 backdrop-blur-sm text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-status-warning/20 animate-pulse border border-white/20">
                    ⚡ FLASH SALE
                  </span>
                )}
              </div>

              {/* Info Container over Image */}
              <div className="absolute inset-x-0 bottom-0 p-2 md:p-3 flex flex-col z-10">
                <h3 className="line-clamp-2 text-[10px] md:text-xs font-bold leading-tight text-white group-hover:text-glow-sakura transition-all duration-300">
                  {game.name}
                </h3>
                <p className="mt-0.5 md:mt-1 text-[8px] md:text-[9px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-sakura transition-colors">
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
