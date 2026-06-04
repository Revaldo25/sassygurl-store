import Link from "next/link";
import Image from "next/image";
import { getAllGamesNormalized } from "@/lib/api-adapter";
import { Compass } from "lucide-react";

type Props = {
  currentSlug: string;
};

import gamesRegistry from "@/shared/registry/games_registry.json";

export default async function RelatedGamesGrid({ currentSlug }: Props) {
  const allGames = await getAllGamesNormalized();
  
  // Find current game category in registry
  const currentRegistry = gamesRegistry.find(g => g.slug === currentSlug);
  const currentCategory = currentRegistry?.category || "Mobile";

  // Filter out current game and prioritize same category
  const related = allGames
    .filter((g) => g.slug !== currentSlug)
    .sort((a, b) => {
       const aReg = gamesRegistry.find(r => r.slug === a.slug);
       const bReg = gamesRegistry.find(r => r.slug === b.slug);
       const aMatch = aReg?.category === currentCategory ? -1 : 1;
       const bMatch = bReg?.category === currentCategory ? -1 : 1;
       return aMatch - bMatch;
    })
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 shadow-2xl backdrop-blur-xl">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6 flex items-center gap-2">
        <Compass className="w-4 h-4 text-sakura" />
        Rekomendasi Game Lain
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {related.map((game) => (
          <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-950/40 p-4 transition-all duration-300 hover:border-sakura/20 hover:bg-sakura/[0.02] hover:translate-x-1"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 transition-transform duration-500 group-hover:scale-105">
              <Image
                src={game.icon}
                alt={game.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-white group-hover:text-sakura transition-colors truncate">
                {game.name}
              </h4>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5 truncate">
                {game.publisher || "Official Partner"}
              </p>
            </div>
            <span className="text-white/20 group-hover:text-sakura transition-colors text-xs shrink-0">
              ➔
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
