import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { Crown, Sparkles, Gem, Gift, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMemberDashboardStats } from "@/app/actions/dashboard";

export const metadata: Metadata = {
  title: "Rewards & VIP Tiers — SassyGurl Store",
  description: "Loyalty Program & Gacha Rewards SassyGurl Store",
};

const tiers = [
  {
    name: "BRONZE",
    xp: "0 - 100.000 XP",
    multiplier: "1.0x XP",
    gacha: "Up to 10% Bonus",
    color: "from-[#cd7f32] via-[#8c5622] to-[#4a2e12]",
    text: "text-orange-200"
  },
  {
    name: "SILVER",
    xp: "100.001 - 500.000 XP",
    multiplier: "1.2x XP",
    gacha: "Up to 25% Bonus",
    color: "from-slate-400 via-slate-600 to-slate-800",
    text: "text-slate-200"
  },
  {
    name: "GOLD",
    xp: "500.001 - 2.000.000 XP",
    multiplier: "1.5x XP",
    gacha: "Up to 50% Bonus",
    color: "from-[#d4af37] via-[#aa7c11] to-[#604b12]",
    text: "text-yellow-200"
  },
  {
    name: "PLATINUM",
    xp: "2.000.001+ XP",
    multiplier: "2.0x XP",
    gacha: "Up to 100% Bonus",
    color: "from-zinc-800 via-zinc-900 to-black",
    text: "text-zinc-300"
  }
];

export default async function RewardsPage() {
  const session = await auth();
  let stats = null;
  
  if (session?.user) {
    try {
      stats = await getMemberDashboardStats();
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-sakura/40 selection:text-white">
      <SiteHeader />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-cyan/20 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[300px] bg-sakura/20 blur-[100px] rounded-full pointer-events-none opacity-40"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">SassyGurl Loyalty Program</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
            Main Semakin <span className="text-sakura">Untung.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium mb-10">
            Dapatkan Sassy Points (XP) di setiap transaksi. Tukarkan XP untuk diskon, naikkan VIP Tier-mu, dan dapatkan kejutan Gacha Bonus di setiap transaksi sukses!
          </p>
          
          {!session ? (
            <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-2xl bg-sakura px-8 py-4 font-black text-black transition-all hover:bg-sakura/90 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(253,176,192,0.3)]">
              GABUNG SEKARANG <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="inline-block relative p-[1px] rounded-3xl overflow-hidden bg-gradient-to-r from-brand-cyan via-sakura to-brand-cyan">
               <div className="bg-[#09090b] rounded-[23px] px-8 py-6 flex items-center gap-6">
                  <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">XP Anda Saat Ini</p>
                     <h3 className="text-3xl font-black text-white">{stats?.points?.toLocaleString("id-ID") || 0} <span className="text-brand-cyan text-xl">XP</span></h3>
                  </div>
                  <div className="w-[1px] h-12 bg-white/10 mx-2"></div>
                  <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Current Tier</p>
                     <div className="flex items-center gap-2">
                        <Crown className="w-6 h-6 text-sakura" />
                        <h3 className="text-2xl font-black text-white">{stats?.loyaltyLevel || "BRONZE"}</h3>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32 relative z-10 space-y-24">
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group hover:border-brand-cyan/30 transition-colors">
             <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-brand-cyan" />
             </div>
             <h3 className="text-xl font-black mb-3">Earn XP</h3>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Dapatkan 1 XP untuk setiap Rp 1.000 yang kamu belanjakan. Kumpulkan XP sebanyak-banyaknya untuk menaikkan Tier!
             </p>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group hover:border-sakura/30 transition-colors">
             <div className="w-14 h-14 rounded-2xl bg-sakura/10 border border-sakura/20 flex items-center justify-center mb-6">
                <Gem className="w-7 h-7 text-sakura" />
             </div>
             <h3 className="text-xl font-black mb-3">Redeem XP</h3>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Gunakan XP-mu saat checkout untuk memotong total harga. 1 XP bernilai Rp 1. Belanja pintar, hemat maksimal.
             </p>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden group hover:border-yellow-400/30 transition-colors">
             <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-6">
                <Gift className="w-7 h-7 text-yellow-400" />
             </div>
             <h3 className="text-xl font-black mb-3">Gacha Drops</h3>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Di setiap transaksi sukses, ada sistem Gacha yang memberikan bonus XP kejutan! Semakin tinggi Tier-mu, peluang jackpot semakin besar!
             </p>
          </div>
        </div>

        {/* Tiers Section */}
        <div>
           <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4">VIP Tiers</h2>
              <p className="text-zinc-400">Tingkatkan status akunmu dan rasakan sensasi multiplier XP yang tidak masuk akal.</p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {tiers.map((tier, idx) => (
                <div key={idx} className={`relative rounded-3xl overflow-hidden p-6 lg:p-8 flex flex-col justify-between min-h-[300px] border border-white/10 ${
                  stats?.loyaltyLevel === tier.name ? "ring-2 ring-sakura ring-offset-4 ring-offset-[#09090b]" : ""
                }`}>
                   <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-80 z-0`}></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0"></div>
                   
                   <div className="relative z-10 flex justify-between items-start mb-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Tier Level</p>
                         <h3 className={`text-2xl font-black drop-shadow-md ${tier.text}`}>{tier.name}</h3>
                      </div>
                      <Crown className={`w-8 h-8 opacity-80 ${tier.text}`} />
                   </div>
                   
                   <div className="relative z-10 space-y-4">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Requirement</p>
                         <p className="text-sm font-bold text-white bg-white/10 inline-block px-3 py-1 rounded-lg backdrop-blur-md">{tier.xp}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Multiplier</p>
                         <p className="text-sm font-bold text-white bg-white/10 inline-block px-3 py-1 rounded-lg backdrop-blur-md">{tier.multiplier}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Gacha Bonus Drops</p>
                         <p className="text-sm font-bold text-white bg-white/10 inline-block px-3 py-1 rounded-lg backdrop-blur-md flex items-center gap-2">
                           <Gift className="w-3.5 h-3.5" /> {tier.gacha}
                         </p>
                      </div>
                   </div>
                </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
