"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Search,
  Bell,
  Settings,
  ArrowUpRight,
  Crown,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  TrendingUp,
  Box,
  Zap,
  Gamepad2,
  Star,
} from "lucide-react";
import { formatIDR, featuredGames } from "@/lib/catalog";
import {
  type DashboardStats,
  type RecentTransaction,
  getMemberTransactions,
} from "@/app/actions/dashboard";

type Props = {
  initialStats: DashboardStats;
  initialTransactions: RecentTransaction[];
};

export default function MemberDashboardClient({ initialStats, initialTransactions }: Props) {
  const [stats] = useState(initialStats);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);
    startTransition(async () => {
      const result = await getMemberTransactions(
        newFilter as "ALL" | "SUCCESS" | "PENDING" | "FAILED",
        search
      );
      setTransactions(result);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(async () => {
      const result = await getMemberTransactions(
        filter as "ALL" | "SUCCESS" | "PENDING" | "FAILED",
        value
      );
      setTransactions(result);
    });
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-8 sm:px-6">
      {/* Background Decorations */}
      <div className="pointer-events-none fixed right-0 top-0 h-[500px] w-[500px] rounded-full bg-sakura/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-brand-cyan/5 blur-[120px]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1100px]"
      >
        {/* ═══════════════ HEADER ═══════════════ */}
        <motion.div variants={item} className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sakura to-brand-cyan opacity-25 blur transition duration-1000 group-hover:opacity-50" />
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                <Crown className="h-8 w-8 text-sakura" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sakura">
                  {stats.loyaltyLevel}
                </span>
              </div>
              <h1 className="flex items-center gap-3 text-4xl font-black uppercase tracking-tighter text-white">
                Dashboard
                <Star className="h-6 w-6 animate-pulse fill-sakura/20 text-sakura" />
              </h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Member Panel
              </p>
            </div>
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <button className="group flex flex-1 justify-center rounded-2xl border border-white/5 bg-zinc-900/50 p-4 text-zinc-400 backdrop-blur-xl transition-all hover:border-sakura/30 hover:text-sakura md:flex-none">
              <Bell className="h-5 w-5 group-hover:animate-bounce" />
            </button>
            <button className="flex flex-1 justify-center rounded-2xl border border-white/5 bg-zinc-900/50 p-4 text-zinc-400 backdrop-blur-xl transition-all hover:border-white/20 hover:text-white md:flex-none">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* ═══════════════ STATS CARDS ═══════════════ */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {[
            { label: "Saldo SassyGurl", value: formatIDR(stats.balance), icon: Wallet, color: "text-sakura" },
            { label: "Total Points", value: `${stats.points.toLocaleString("id-ID")} XP`, icon: TrendingUp, color: "text-brand-cyan" },
            { label: "Total Order", value: `${stats.totalOrders} Transaksi`, icon: Box, color: "text-emerald-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -5, borderColor: "rgba(255,255,255,0.1)" }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-2xl transition-all"
            >
              <div className={`absolute right-0 top-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 ${stat.color}`}>
                <stat.icon size={120} />
              </div>
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tight text-white">{stat.value}</h3>
              <div className="mt-6 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                <Zap className={`h-3 w-3 fill-current ${stat.color}`} />
                {stat.label === "Total Order"
                  ? `${stats.successOrders} sukses • ${stats.pendingOrders} pending`
                  : `Level: ${stats.loyaltyLevel}`}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════ QUICK TOP-UP ═══════════════ */}
        <motion.div variants={item} className="mb-12 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-white">
              <Gamepad2 className="text-sakura" /> Quick Top-Up
            </h2>
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors hover:text-white">
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredGames.slice(0, 4).map((game) => (
              <Link
                key={game.slug}
                href={`/game/${game.slug}`}
                className="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/40 p-6 text-center transition-all hover:bg-zinc-800/50"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 transition-all group-hover:border-sakura/50">
                  <div
                    className="absolute inset-0 bg-gradient-to-br opacity-60"
                    style={{ background: `linear-gradient(135deg, ${game.accent}40, transparent)` }}
                  />
                  <span className="flex h-full w-full items-center justify-center text-lg font-black text-white">
                    {game.shortCode}
                  </span>
                </div>
                <p className="text-xs font-black uppercase tracking-tighter text-zinc-300 transition-colors group-hover:text-white">
                  {game.name.split(":")[0]}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════ TRANSACTION HISTORY ═══════════════ */}
        <motion.div variants={item} className="overflow-hidden rounded-[3rem] border border-white/5 bg-zinc-900/20 shadow-2xl backdrop-blur-3xl">
          {/* Header + Search */}
          <div className="space-y-8 border-b border-white/5 bg-white/[0.02] p-8 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-white">
                <History className="h-5 w-5 text-sakura" /> Riwayat Transaksi
              </h2>
              <div className="group relative w-full sm:w-80">
                <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-sakura" />
                <input
                  type="text"
                  placeholder="Cari invoice atau game..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 py-4 pl-12 pr-6 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-700 focus:border-sakura focus:ring-4 focus:ring-sakura/5"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {["ALL", "SUCCESS", "PENDING", "FAILED"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleFilterChange(tab)}
                  disabled={isPending}
                  className={`whitespace-nowrap rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    filter === tab
                      ? "bg-white text-zinc-950 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                      : "border border-white/5 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {tab === "ALL" ? "Semua" : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction List */}
          <div className="p-2 sm:p-4">
            <AnimatePresence mode="wait">
              {transactions.length > 0 ? (
                <motion.div
                  key={filter + search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Desktop Table */}
                  <table className="hidden w-full text-left md:table">
                    <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                      <tr>
                        <th className="px-8 py-6">Invoice / Tanggal</th>
                        <th className="px-8 py-6">Game & Produk</th>
                        <th className="px-8 py-6 text-center">Status</th>
                        <th className="px-8 py-6 text-right">Nominal</th>
                        <th className="px-8 py-6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="group transition-colors hover:bg-white/[0.02]">
                          <td className="px-8 py-6">
                            <div className="font-mono text-xs font-black text-white transition-colors group-hover:text-sakura">{tx.invoiceId}</div>
                            <div className="mt-1 text-[10px] font-bold uppercase tracking-tighter text-zinc-600">
                              {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-xs font-black uppercase tracking-tight text-zinc-200">{tx.gameName}</div>
                            <div className="mt-1 text-[10px] font-bold italic text-zinc-500">{tx.productName}</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <StatusBadge status={tx.paymentStatus} />
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="text-sm font-black tracking-tighter text-white">{formatIDR(tx.amount)}</div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <Link
                              href={`/invoice/${tx.invoiceId}`}
                              className="rounded-xl border border-white/5 bg-zinc-900 p-3 text-zinc-500 transition-all hover:border-sakura hover:text-white hover:shadow-[0_0_15px_rgba(253,176,192,0.2)]"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Cards */}
                  <div className="space-y-4 p-4 md:hidden">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="space-y-5 rounded-3xl border border-white/5 bg-zinc-900/40 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{tx.invoiceId}</div>
                            <div className="mt-1 text-sm font-black uppercase text-white">{tx.gameName}</div>
                          </div>
                          <StatusBadge status={tx.paymentStatus} />
                        </div>
                        <div className="flex items-end justify-between border-t border-white/5 pt-4">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-zinc-500">{tx.productName}</div>
                            <div className="mt-1 text-lg font-black tracking-tighter text-white">{formatIDR(tx.amount)}</div>
                          </div>
                          <Link
                            href={`/invoice/${tx.invoiceId}`}
                            className="rounded-xl border border-white/10 bg-zinc-800 p-3 text-sakura"
                          >
                            <ArrowUpRight className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4 py-20 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-zinc-900">
                    <Search className="h-6 w-6 text-zinc-700" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">
                    Belum ada transaksi
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "PAID"
      ? { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2, label: "SUCCESS" }
      : status === "PENDING"
        ? { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock, label: "PENDING" }
        : { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "FAILED" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[9px] font-black shadow-sm ${config.color}`}>
      <config.icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
