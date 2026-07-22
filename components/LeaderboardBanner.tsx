import Link from 'next/link';
import { Trophy, ChevronRight, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeaderboardBanner() {
  return (
    <div className="relative z-20 mx-auto max-w-6xl px-4 py-4 md:px-6">
      <Link href="/leaderboard" className="block w-full">
        <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-amber-500/20 via-[#1a1a1a] to-[#111] border border-amber-500/30 p-1 group transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:border-amber-500/50">
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-zinc-950/80 rounded-[1.25rem] md:rounded-[1.75rem] backdrop-blur-xl">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-obsidian shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Peringkat Sultan SassyGurl</h3>
                  <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 animate-pulse" />
                </div>
                <p className="text-[10px] md:text-sm font-medium text-zinc-400 mt-0.5">Lihat siapa saja top spender bulan ini & raih prestise!</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-amber-500/20 group-hover:border-amber-500/50 transition-colors shrink-0">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-amber-400" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
