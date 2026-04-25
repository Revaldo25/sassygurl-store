"use client";

import { motion, Variants } from "framer-motion"; // <-- Tambahkan Variants di sini
import { 
  TrendingUp, Wallet, History, Zap, 
  ChevronRight, Star, CreditCard, Box 
} from "lucide-react";
import { PremiumUser } from "@/components/PremiumIcons";

export default function DashboardContent({ userName }: { userName: string }) {
  
  // --- MEMBERIKAN TIPE DATA VARIANTS AGAR TYPESCRIPT DIAM ---
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", // Sekarang TS tahu ini adalah animasi spring
        stiffness: 300, 
        damping: 24 
      } 
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10"
    >
      {/* --- HERO SECTION --- */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sakura/10 rounded-lg border border-sakura/20">
              <PremiumUser />
            </div>
            <span className="text-[10px] font-black text-sakura uppercase tracking-[0.4em]">Elite Protocol Active</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600">{userName || "Sultan"}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-2xl">
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Loyalty Level</p>
            <p className="text-sm font-black text-white uppercase italic">Sultan Immortal</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sakura to-brand-cyan flex items-center justify-center shadow-[0_0_20px_rgba(253,176,192,0.3)]">
            <Star className="text-white w-6 h-6 fill-white" />
          </div>
        </div>
      </motion.div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Sassy Balance", value: "Rp 12.500.000", icon: Wallet, color: "text-sakura" },
          { label: "Total Points", value: "850.200 XP", icon: TrendingUp, color: "text-brand-cyan" },
          { label: "Active Orders", value: "12 Transaksi", icon: Box, color: "text-emerald-400" },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={item}
            whileHover={{ y: -5, borderColor: "rgba(255,255,255,0.1)" }}
            className="group relative bg-zinc-900/30 backdrop-blur-2xl border border-white/5 p-8 rounded-[2rem] overflow-hidden transition-all"
          >
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
              <stat.icon size={120} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
            <div className="mt-6 flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
              <Zap className={`w-3 h-3 ${stat.color} fill-current`} /> +12% Dari bulan lalu
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- QUICK TOP-UP --- */}
      <motion.div variants={item} className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <CreditCard className="text-sakura" /> Quick Purchase
          </h2>
          <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">See All Games</button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Mobile Legends", "Valorant", "Genshin Impact", "Free Fire"].map((game, i) => (
            <div key={i} className="group cursor-pointer bg-zinc-900/40 border border-white/5 p-6 rounded-3xl hover:bg-zinc-800/50 transition-all flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 group-hover:border-sakura/50 transition-all overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <p className="text-xs font-black text-zinc-300 uppercase tracking-tighter group-hover:text-white transition-colors">{game}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* --- RECENT ACTIVITY --- */}
      <motion.div variants={item} className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <History className="text-brand-cyan" /> Recent Activity
          </h2>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Product</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {[1, 2, 3].map((_, i) => (
                <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-zinc-400 font-mono text-xs">#SG-{2026 + i}9901</td>
                  <td className="p-4 text-white font-bold">5000+ Diamonds MLBB</td>
                  <td className="p-4 text-zinc-300">Rp 1.250.000</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Success</span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><ChevronRight size={16} className="text-zinc-500" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}