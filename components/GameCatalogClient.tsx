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

  // In a real app, categories might come from the backend. 
  // For now, we'll extract unique tags or just use standard ones.
  // Since NormalizedGame doesn't have a specific 'category' field right now, 
  // we'll filter based on a derived property or just provide a basic filter.
  const categories = ["SEMUA", "POPULER", "MOBILE", "PC"];

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Search filter
      const matchesSearch = (game.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                            (game.shortCode?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Tab filter (simulated logic since we lack strict category data in NormalizedGame)
      if (activeTab === "SEMUA") return true;
      if (activeTab === "POPULER") return game.isHot;
      
      // Simple heuristic for Mobile vs PC based on name/slug for demo purposes
      const isMobile = ["mlbb", "genshin", "pubg", "ff", "hsr", "zzz", "wuwa", "hok", "mccg"].includes(game.slug);
      if (activeTab === "MOBILE") return isMobile;
      if (activeTab === "PC") return !isMobile;

      return true;
    });
  }, [games, searchQuery, activeTab]);

  return (
    <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      {/* ── Search & Filter Bar (Ditusi Style) ───────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide md:pb-0">
          {categories.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "shrink-0 rounded-2xl border px-5 py-2.5 text-xs font-bold tracking-[0.1em] transition-all duration-200",
                  isActive
                    ? "border-sakura/40 bg-sakura/15 text-sakura shadow-[0_0_15px_rgba(253,176,192,0.15)]"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                ].join(" ")}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-white/40" />
          </div>
          <input
            type="text"
            placeholder="Cari game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-sakura/50 focus:bg-white/10"
          />
        </div>
      </div>

      {/* ── Game Grid (Ditusi Style: Portrait Cards) ─────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredGames.map((game) => (
          <Link
            key={game.slug}
            href={`/game/${game.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900/50 transition-all duration-300 hover:-translate-y-1.5 hover:border-sakura/40 hover:shadow-[0_10px_30px_rgba(253,176,192,0.15)]"
          >
            {/* Image Container (Portrait 3:4 or 4:5 ratio) */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-950">
              {/* Fallback pattern if image is missing/broken */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
              
              <Image
                src={game.coverImage || game.banner}
                alt={game.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Anti-nimpak gradient bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

              {/* Badges */}
              <div className="absolute left-2 top-2 flex flex-col gap-1.5">
                {game.isHot && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/90 px-2 py-1 text-[9px] font-black tracking-wider text-white backdrop-blur-md">
                    <Flame className="h-3 w-3" />
                    HOT
                  </span>
                )}
              </div>
            </div>

            {/* Info Container */}
            <div className="relative flex flex-1 flex-col justify-end p-3.5 pt-0">
              {/* Icon overlap */}
              <div className="-mt-6 mb-2 h-12 w-12 overflow-hidden rounded-xl border-2 border-zinc-950 bg-zinc-900 shadow-lg">
                <Image 
                  src={game.icon} 
                  alt={game.shortCode} 
                  width={48} 
                  height={48} 
                  className="h-full w-full object-cover"
                />
              </div>

              <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white group-hover:text-sakura transition-colors">
                {game.name}
              </h3>
              <p className="mt-1 text-[10px] text-white/40">
                {game.currencyName || "Top Up Instant"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/5 py-20 text-center">
          <Star className="mb-4 h-12 w-12 text-white/10" />
          <h3 className="text-lg font-bold text-white">Game tidak ditemukan</h3>
          <p className="mt-2 text-sm text-white/40">Coba cari dengan kata kunci lain.</p>
        </div>
      )}
    </section>
  );
}
