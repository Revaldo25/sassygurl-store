"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion"; // <-- Tambahkan Variants di sini
import { 
  Search, Bell, Settings, ArrowUpRight, 
  Crown, History, Filter, LayoutGrid, 
  CheckCircle2, Clock, XCircle 
} from "lucide-react";
import { PremiumUser } from "@/components/PremiumIcons";

export default function DashboardPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const transactions = [
    { id: "tx1", game: "Genshin Impact", item: "Welkin Moon", amount: 79000, status: "SUCCESS", date: "04 Apr 2026", invoice: "SGY-8X29A" },
    { id: "tx2", game: "Mobile Legends", item: "86 Diamonds", amount: 19500, status: "PENDING", date: "04 Apr 2026", invoice: "SGY-9L11B" },
    { id: "tx3", game: "Valorant", item: "420 VP", amount: 49000, status: "FAILED", date: "03 Apr 2026", invoice: "SGY-7K00C" },
    { id: "tx4", game: "Arknights: Endfield", item: "Monthly Pass", amount: 75000, status: "SUCCESS", date: "02 Apr 2026", invoice: "SGY-5M12Z" },
  ];

  const filteredTx = transactions.filter(tx => {
    const matchFilter = filter === "ALL" || tx.status === filter;
    const matchSearch = tx.game.toLowerCase().includes(search.toLowerCase()) || tx.invoice.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // --- MEMBERIKAN TIPE DATA VARIANTS AGAR TYPESCRIPT DIAM ---
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", // Sekarang TypeScript tahu ini adalah tipe animasi Spring
        stiffness: 300, 
        damping: 24 
      } 
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-sakura/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1100px] mx-auto relative z-10"
      >
        
        {/* ================= HEADER SECTION ================= */}
        <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sakura to-brand-cyan rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/10 overflow-hidden">
                <PremiumUser />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-sakura uppercase tracking-[0.4em]">Elite Member</span>
                <div className="h-1 w-1 rounded-full bg-zinc-700"></div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">ID: 992026</span>
              </div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                Sultan99 <Crown className="w-6 h-6 text-sakura fill-sakura/20 animate-pulse" />
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">sultan@sassygurl.com</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none p-4 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl text-zinc-400 hover:text-sakura hover:border-sakura/30 transition-all flex justify-center group">
              <Bell className="w-5 h-5 group-hover:animate-bounce" />
            </button>
            <button className="flex-1 md:flex-none p-4 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 transition-all flex justify-center">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* ================= STATS CARDS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          <motion.div variants={item} className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-sakura/10 col-span-2 md:col-span-1 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><LayoutGrid size={80} /></div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">Total Investasi Game</p>
            <div className="text-3xl font-black text-white tracking-tighter">Rp 985.000</div>
          </motion.div>

          <motion.div variants={item} className="bg-zinc-900/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">Order Success</p>
            <div className="text-3xl font-black text-white tracking-tighter">14<span className="text-sm text-zinc-600 ml-1">Orders</span></div>
          </motion.div>

          <motion.div variants={item} className="bg-zinc-900/30 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><Crown className="w-32 h-32 text-sakura" /></div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">Loyalty Status</p>
            <div className="text-3xl font-black text-sakura tracking-tighter italic">PLATINUM</div>
          </motion.div>
        </div>

        {/* ================= TRANSACTION LIST ================= */}
        <motion.div variants={item} className="bg-zinc-900/20 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          
          <div className="p-8 sm:p-10 border-b border-white/5 bg-white/[0.02] space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <History className="w-5 h-5 text-sakura" /> Riwayat Protokol Top-Up
              </h2>
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-sakura transition-colors" />
                <input 
                  type="text" placeholder="Cari invoice atau judul game..." 
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold text-white focus:border-sakura focus:ring-4 focus:ring-sakura/5 outline-none transition-all placeholder:text-zinc-700" 
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {["ALL", "SUCCESS", "PENDING", "FAILED"].map((tab) => (
                <button 
                  key={tab} onClick={() => setFilter(tab)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${
                    filter === tab 
                      ? "bg-white text-zinc-950 shadow-[0_10px_20px_rgba(255,255,255,0.1)]" 
                      : "bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {tab === "ALL" ? "Semua Transaksi" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 sm:p-4">
            <AnimatePresence mode="wait">
              {filteredTx.length > 0 ? (
                <motion.div
                  key={filter + search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-x-auto"
                >
                  <table className="w-full text-left hidden md:table">
                    <thead className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-8 py-6">Identity / Date</th>
                        <th className="px-8 py-6">Asset Details</th>
                        <th className="px-8 py-6 text-center">Security Status</th>
                        <th className="px-8 py-6 text-right">Value</th>
                        <th className="px-8 py-6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredTx.map(tx => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="text-xs font-black text-white font-mono group-hover:text-sakura transition-colors">{tx.invoice}</div>
                            <div className="text-[10px] text-zinc-600 font-bold mt-1 uppercase tracking-tighter">{tx.date}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-black text-zinc-200 uppercase tracking-tight">{tx.game}</div>
                            <div className="text-[10px] text-zinc-500 font-bold mt-1 italic">{tx.item}</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-4 py-1.5 rounded-full border shadow-sm ${
                              tx.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                              tx.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                              "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {tx.status === "SUCCESS" && <CheckCircle2 className="w-3 h-3" />}
                              {tx.status === "PENDING" && <Clock className="w-3 h-3" />}
                              {tx.status === "FAILED" && <XCircle className="w-3 h-3" />}
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="text-sm font-black text-white tracking-tighter">Rp {tx.amount.toLocaleString('id-ID')}</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white hover:border-sakura hover:shadow-[0_0_15px_rgba(253,176,192,0.2)] transition-all">
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="md:hidden space-y-4 p-4">
                    {filteredTx.map(tx => (
                      <div key={tx.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 space-y-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{tx.invoice}</div>
                            <div className="text-sm font-black text-white mt-1 uppercase">{tx.game}</div>
                          </div>
                          <span className={`text-[9px] font-black px-3 py-1 rounded-lg border ${
                            tx.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                            tx.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>{tx.status}</span>
                        </div>
                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                          <div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">{tx.item}</div>
                            <div className="text-lg font-black text-white tracking-tighter mt-1">Rp {tx.amount.toLocaleString('id-ID')}</div>
                          </div>
                          <button className="p-3 rounded-xl bg-zinc-800 border border-white/10 text-sakura"><ArrowUpRight className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                    <Search className="w-6 h-6 text-zinc-700" />
                  </div>
                  <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Data Protokol Tidak Ditemukan</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}