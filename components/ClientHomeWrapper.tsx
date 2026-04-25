"use client";
import { useState } from "react";
import GameCard from "./GameCard";

export default function ClientHomeWrapper({ games, categories }: any) {
  const [activeTab, setActiveTab] = useState("ALL");

  const filteredGames = games.filter((game: any) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "BEST SELLER") return game.isHot;
    return game.category.name.toUpperCase() === activeTab;
  });

  return (
    <section id="games" className="mx-auto max-w-7xl px-6 py-12">
      
      {/* KATEGORI PILL ELEGANT (Fixed z-index issue) */}
      <div className="sticky top-20 z-40 mb-10 flex justify-center">
        <div className="flex gap-2 rounded-full border border-pink-500/10 bg-black/60 p-2 backdrop-blur-xl shadow-xl">
          {["ALL", "BEST SELLER", ...categories.map((c:any) => c.name.toUpperCase())].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`rounded-full px-6 py-2 text-[10px] font-black tracking-widest transition-all duration-300 ${
                activeTab === cat 
                ? "bg-pink-600 text-white shadow-[0_0_15px_rgba(244,114,182,0.5)]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredGames.map((game: any) => (
          <GameCard 
            key={game.id} 
            id={game.slug}
            name={game.name}
            category={game.category.name}
            image={game.coverImage}
            minPrice={game.minPrice}
            isHot={game.isHot}
          />
        ))}
      </div>
    </section>
  );
}