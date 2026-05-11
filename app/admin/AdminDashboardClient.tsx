"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useTransition } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Search,
  TrendingUp,
  DollarSign,
  Users,
  Gamepad2,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  LayoutDashboard,
  History,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { formatIDR } from "@/lib/catalog";
import {
  type OwnerStats,
  type AdminTransaction,
  getAdminTransactions,
  updateTransactionStatus,
  triggerCatalogSync,
} from "@/app/actions/dashboard";
import { ProviderStatus } from "@/lib/api-adapter";

type Props = {
  initialStats: OwnerStats;
  initialTransactions: AdminTransaction[];
  providerStatuses: ProviderStatus[];
};

export default function AdminDashboardClient({ initialStats, initialTransactions, providerStatuses }: Props) {
  const [stats] = useState(initialStats);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "games" | "payments" | "providers">("overview");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);
    startTransition(async () => {
      const { transactions: result } = await getAdminTransactions(newFilter, search);
      setTransactions(result);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(async () => {
      const { transactions: result } = await getAdminTransactions(filter, value);
      setTransactions(result);
    });
  }

  async function handleStatusUpdate(txId: string, status: "PROCESSING" | "SUCCESS" | "ERROR") {
    const result = await updateTransactionStatus(txId, status);
    if (result.success) {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === txId ? { ...tx, orderStatus: status } : tx))
      );
    }
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-8 sm:px-6">
      {/* Background */}
      <div className="pointer-events-none fixed right-0 top-0 h-[600px] w-[600px] rounded-full bg-sakura/5 blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-brand-cyan/5 blur-[120px]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1200px]"
      >
        {/* ═══════════════ HEADER ═══════════════ */}
        <motion.div variants={item} className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sakura" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sakura">
                ADMIN COMMAND CENTER
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white md:text-5xl">
              Dashboard Sultan
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kelola transaksi, produk, dan provider dari satu tempat.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={async () => {
                if (confirm("Mulai sinkronisasi katalog dari Digiflazz & VIP?")) {
                  startTransition(async () => {
                    const res = await triggerCatalogSync();
                    alert(res.message);
                  });
                }
              }}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/50 px-6 py-3 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-cyan-400 ${isPending ? "animate-spin" : ""}`} />
              Sync API
            </button>
            <button
              onClick={() => handleFilterChange(filter)}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sakura px-6 py-3 text-sm font-black text-zinc-950 shadow-[0_0_25px_rgba(253,176,192,0.2)] transition hover:scale-[1.02] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
          </div>
        </motion.div>

        {/* ═══════════════ TAB NAVIGATION ═══════════════ */}
        <motion.div variants={item} className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
            { id: "transactions", label: "Transaksi", icon: History },
            { id: "games", label: "Kelola Game", icon: Gamepad2 },
            { id: "payments", label: "Payment Gateway", icon: DollarSign },
            { id: "providers", label: "Provider Status", icon: Megaphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "border-sakura/40 bg-sakura/15 text-sakura shadow-[0_0_16px_rgba(253,176,192,0.12)]"
                  : "border-white/5 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ═══════════════ TAB: OVERVIEW ═══════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Total Omzet", value: formatIDR(stats.totalRevenue), icon: DollarSign, color: "text-white", accent: "border-sakura/20 bg-sakura/5" },
                  { label: "Laba Bersih", value: formatIDR(stats.netProfit), icon: TrendingUp, color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5" },
                  { label: "Omzet Hari Ini", value: formatIDR(stats.todayRevenue), icon: Clock, color: "text-brand-cyan", accent: "border-brand-cyan/20 bg-brand-cyan/5" },
                  { label: "Laba Hari Ini", value: formatIDR(stats.todayProfit), icon: ArrowUpRight, color: "text-violet-400", accent: "border-violet-500/20 bg-violet-500/5" },
                  { label: "Total Member", value: stats.totalUsers.toLocaleString("id-ID"), icon: Users, color: "text-amber-400", accent: "border-amber-500/20 bg-amber-500/5" },
                  { label: "Produk Aktif", value: String(stats.totalProducts), icon: Package, color: "text-pink-400", accent: "border-pink-500/20 bg-pink-500/5" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    variants={item}
                    whileHover={{ y: -4 }}
                    className={`group relative overflow-hidden rounded-[2rem] border p-8 backdrop-blur-2xl transition-all ${stat.accent}`}
                  >
                    <div className={`absolute right-0 top-0 p-6 opacity-5 transition-opacity group-hover:opacity-10 ${stat.color}`}>
                      <stat.icon size={100} />
                    </div>
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{stat.label}</p>
                    <h3 className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Revenue Chart */}
              <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                  <TrendingUp className="h-5 w-5 text-sakura" /> Grafik Pendapatan Harian
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.dailyRevenue.length > 0 ? stats.dailyRevenue : [
                        { date: "N/A", revenue: 0, profit: 0 }
                      ]}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FDB0C0" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FDB0C0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString()}k`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#FDB0C0', fontWeight: 'bold' }}
                        formatter={(value: any, name: string) => [
                          `Rp ${Number(value).toLocaleString("id-ID")}`, 
                          name === "revenue" ? "Omzet" : "Laba"
                        ]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#FDB0C0" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="profit" stroke="#34D399" strokeWidth={2} fillOpacity={0.1} fill="#34D399" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Transaction Summary */}
              <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                  <History className="h-5 w-5 text-sakura" /> Transaksi Terbaru
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Sukses", count: stats.successTransactions, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Pending", count: stats.pendingTransactions, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                    { label: "Gagal", count: stats.failedTransactions, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-2xl border p-6 text-center ${s.color}`}>
                      <p className="text-3xl font-black">{s.count}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ TAB: TRANSACTIONS ═══════════════ */}
          {activeTab === "transactions" && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="overflow-hidden rounded-[3rem] border border-white/5 bg-zinc-900/20 shadow-2xl backdrop-blur-3xl"
            >
              {/* Filter Header */}
              <div className="space-y-6 border-b border-white/5 bg-white/[0.02] p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                    <History className="h-5 w-5 text-sakura" /> Kelola Transaksi
                  </h2>
                  <div className="group relative w-full sm:w-80">
                    <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-sakura" />
                    <input
                      type="text"
                      placeholder="Cari invoice, game, atau ID..."
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 py-4 pl-12 pr-6 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-700 focus:border-sakura focus:ring-4 focus:ring-sakura/5"
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {["ALL", "SUCCESS", "PENDING", "FAILED"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleFilterChange(tab)}
                      disabled={isPending}
                      className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                        filter === tab
                          ? "bg-white text-zinc-950 shadow-lg"
                          : "border border-white/5 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      {tab === "ALL" ? "Semua" : tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-4">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <tr>
                      <th className="px-6 py-4">Invoice</th>
                      <th className="px-6 py-4">Game / Produk</th>
                      <th className="px-6 py-4">Target ID</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Nominal</th>
                      <th className="px-6 py-4 text-right">Profit</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="group transition-colors hover:bg-white/[0.02]">
                        <td className="px-6 py-5">
                          <div className="font-mono text-xs font-black text-white transition-colors group-hover:text-sakura">
                            {tx.invoiceId}
                          </div>
                          <div className="mt-1 text-[10px] text-zinc-600">
                            {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-bold text-zinc-200">{tx.gameName}</div>
                          <div className="mt-0.5 text-[10px] italic text-zinc-500">{tx.productName}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-mono text-xs text-zinc-400">{tx.targetId}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <AdminStatusBadge status={tx.orderStatus} />
                        </td>
                        <td className="px-6 py-5 text-right text-sm font-black text-white">
                          {formatIDR(tx.amount)}
                        </td>
                        <td className="px-6 py-5 text-right text-sm font-bold text-emerald-400">
                          +{formatIDR(tx.profit)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {tx.orderStatus === "PENDING" && (
                              <button
                                onClick={() => handleStatusUpdate(tx.id, "PROCESSING")}
                                className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold text-amber-400 transition hover:bg-amber-500/20"
                              >
                                Process
                              </button>
                            )}
                            {(tx.orderStatus === "PENDING" || tx.orderStatus === "PROCESSING" || tx.orderStatus === "ERROR") && (
                              <button
                                onClick={() => handleStatusUpdate(tx.id, "SUCCESS")}
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                              >
                                ✓ Done
                              </button>
                            )}
                            {(tx.orderStatus === "ERROR" || tx.orderStatus === "PENDING") && (
                              <button
                                onClick={() => {
                                  alert("Auto-Healing diproses... Mencoba sinkronisasi ulang dengan API Provider.");
                                  handleStatusUpdate(tx.id, "PROCESSING");
                                }}
                                className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold text-cyan-400 transition hover:bg-cyan-500/20"
                                title="Auto-Heal Transaction (Retry API)"
                              >
                                ⚡ Auto-Heal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {transactions.length === 0 && (
                  <div className="py-16 text-center">
                    <Search className="mx-auto h-8 w-8 text-zinc-700" />
                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-600">Tidak ada data</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════════════ TAB: GAMES (CRUD) ═══════════════ */}
          {activeTab === "games" && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                  <Gamepad2 className="h-5 w-5 text-sakura" /> Manajemen Game & Katalog
                </h2>
                <button className="rounded-xl bg-sakura px-4 py-2 text-xs font-bold text-zinc-950 transition hover:scale-105">
                  + Tambah Game
                </button>
              </div>
              <div className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-2xl">
                <p className="text-sm text-zinc-400">
                  Sistem menggunakan <strong className="text-sakura">Slug Strategy</strong>. 
                  Jika Anda membuat game dengan slug <code className="rounded bg-black/50 px-1 text-white">valorant</code>, sistem otomatis memuat asset dari <code className="rounded bg-black/50 px-1 text-white">/images/games/valorant-banner.webp</code>.
                </p>
                <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-white/10 p-12 text-zinc-600">
                  <p>Tabel Manajemen Game akan dirender di sini via API.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ TAB: PAYMENTS ═══════════════ */}
          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                <DollarSign className="h-5 w-5 text-sakura" /> Payment Gateway Control
              </h2>
              <div className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-2xl">
                <p className="text-sm text-zinc-400">
                  Atur metode pembayaran (QRIS, E-Wallet, VA). Fee flat dan persentase dapat dikonfigurasi secara real-time.
                </p>
                <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-white/10 p-12 text-zinc-600">
                  <p>Tabel Metode Pembayaran akan dirender di sini via API.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ TAB: PROVIDERS ═══════════════ */}
          {activeTab === "providers" && (
            <motion.div
              key="providers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                <Megaphone className="h-5 w-5 text-sakura" /> Status Provider API
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {providerStatuses.map((provider) => (
                  <div
                    key={provider.name}
                    className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-2xl"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-black text-white">{provider.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[10px] font-bold ${
                          provider.isActive
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${provider.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                        {provider.isActive ? "ACTIVE" : "DOWN"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Success Rate</p>
                        <p className="mt-2 text-2xl font-black text-emerald-400">{provider.successRate}%</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Avg Latency</p>
                        <p className="mt-2 text-2xl font-black text-white">{provider.avgLatency}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-[10px] text-zinc-600">
                      Last checked: {new Date(provider.lastChecked).toLocaleTimeString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function AdminStatusBadge({ status }: { status: string }) {
  const config =
    status === "SUCCESS"
      ? { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 }
      : status === "PROCESSING"
        ? { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: RefreshCw }
        : status === "PENDING"
          ? { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock }
          : { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black ${config.color}`}>
      <config.icon className="h-3 w-3" />
      {status}
    </span>
  );
}
