"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
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
  Activity,
  Zap,
} from "lucide-react";
import { formatIDR } from "@/lib/catalog";
import {
  type OwnerStats,
  type AdminStats,
  type AdminTransaction,
  getAdminTransactions,
  updateTransactionStatus,
  triggerCatalogSync,
  createGame,
  updateGame,
  deleteGame,
} from "@/app/actions/dashboard";
import { ProviderStatus } from "@/lib/api-adapter";

type Props = {
  initialStats: OwnerStats | AdminStats;
  initialTransactions: AdminTransaction[];
  providerStatuses: ProviderStatus[];
  initialGames: any[];
  role: string;
};

export default function AdminDashboardClient({ initialStats, initialTransactions, providerStatuses, initialGames, role }: Props) {
  const isOwner = role?.toUpperCase() === "SUPERADMIN" || role?.toUpperCase() === "OWNER";
  const ownerStats = initialStats as OwnerStats;
  const adminStats = initialStats as AdminStats;

  const [stats] = useState(initialStats);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [games, setGames] = useState(initialGames);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;
  
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "games" | "payments" | "providers">(
    ["overview", "transactions", "games", "payments", "providers"].includes(tabParam) ? tabParam : "overview"
  );

  useEffect(() => {
    if (tabParam && ["overview", "transactions", "games", "payments", "providers"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  // Game Form State
  const [showGameModal, setShowGameModal] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [gameFormData, setGameFormData] = useState({
    name: "",
    slug: "",
    publisher: "",
    description: "",
    type: "GAME", // GAME or VOUCHER
    currencyName: "Diamonds",
    hasServerId: false,
    isActive: true,
    isHot: false,
    thumbnail: ""
  });

  const handleSync = async () => {
    setIsSyncing(true);
    const res = await triggerCatalogSync();
    alert(res.message);
    setIsSyncing(false);
  };

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`)
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log("Connected to Real-Time NotificationHub"))
      .catch((err) => console.error("SignalR Connection Error:", err));

    connection.on("TransactionUpdated", (data: any) => {
      setTransactions((prev) => {
        const idx = prev.findIndex((t) => t.id === data.transactionId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            orderStatus: data.orderStatus,
            paymentStatus: data.paymentStatus,
            providerRef: data.providerRef
          };
          return updated;
        }
        return [{
          id: data.transactionId,
          invoiceId: data.invoiceId,
          gameName: data.gameName,
          productName: data.productName,
          targetId: data.targetId,
          amount: data.amount,
          paymentStatus: data.paymentStatus,
          orderStatus: data.orderStatus,
          providerRef: data.providerRef,
          profit: 0, 
          createdAt: data.updatedAt
        }, ...prev];
      });
    });

    return () => {
      connection.stop();
    };
  }, []);

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

  async function handleGameSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      let res;
      if (editingGame) {
        res = await updateGame(editingGame.id, gameFormData);
      } else {
        res = await createGame(gameFormData);
      }

      if (res.success) {
        alert(editingGame ? "Game updated!" : "Game created!");
        setShowGameModal(false);
        setEditingGame(null);
      } else {
        alert(res.message);
      }
    });
  }

  async function handleDeleteGame(id: string) {
    if (!confirm("Are you sure you want to delete this game?")) return;
    startTransition(async () => {
      const res = await deleteGame(id);
      if (res.success) {
        alert("Game deleted");
      } else {
        alert(res.message);
      }
    });
  }


  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-8 sm:px-6">
      <div className="pointer-events-none fixed right-0 top-0 h-[600px] w-[600px] rounded-full bg-sakura/5 blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-brand-cyan/5 blur-[120px]" />

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-[1200px]">
        <motion.div variants={item} className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sakura" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sakura">ADMIN COMMAND CENTER</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white md:text-5xl">Dashboard Sultan</h1>
          </div>
        </motion.div>

        <motion.div variants={item} className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
            { id: "transactions", label: "Transaksi", icon: History },
            ...(isOwner ? [
              { id: "games", label: "Kelola Game", icon: Gamepad2 },
              { id: "providers", label: "Provider Status", icon: Megaphone },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-bold transition-all ${
                activeTab === tab.id ? "border-sakura/40 bg-sakura/15 text-sakura shadow-[0_0_16px_rgba(253,176,192,0.12)]" : "border-white/5 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">

              {/* System Health & Provider Balance */}
              <motion.div variants={item} className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-3xl">
                  <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                    <Activity className="h-5 w-5 text-sakura" /> System Health & Provider Balance
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {providerStatuses.map((ps: any) => (
                      <div key={ps.name} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05]">
                        <div className="flex items-center gap-4">
                          <div className={`h-3 w-3 rounded-full ${ps.isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 animate-pulse"}`} />
                          <div>
                            <p className="text-xs font-black text-white">{ps.name}</p>
                            <p className="text-[10px] font-bold text-zinc-500">{ps.isActive ? "Online" : "Trouble"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{formatIDR(ps.balance ?? 0)}</p>
                          <p className="text-[8px] font-black text-zinc-600 uppercase">Balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/5 bg-gradient-to-br from-sakura/10 to-transparent p-8 backdrop-blur-3xl">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-sakura">Quick Actions</p>
                  <h3 className="text-lg font-black text-white tracking-tighter mb-6">Operations</h3>
                  <div className="space-y-3">
                    <button onClick={handleSync} disabled={isSyncing} className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95">
                      <span>Sync Catalog</span>
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                    </button>
                    <button className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10">
                      <span>Clear Cache</span>
                      <Zap className="h-4 w-4 text-amber-400" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ...(isOwner ? [
                    { label: "Total Omzet", value: formatIDR(ownerStats.totalRevenue), color: "text-white", accent: "border-sakura/20 bg-sakura/5" },
                    { label: "Laba Bersih", value: formatIDR(ownerStats.netProfit), color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5" },
                    { label: "Omzet Hari Ini", value: formatIDR(ownerStats.todayRevenue), color: "text-brand-cyan", accent: "border-brand-cyan/20 bg-brand-cyan/5" },
                  ] : []),
                  { label: "Total Member", value: String(stats.totalUsers), color: "text-amber-400", accent: "border-amber-500/20 bg-amber-500/5" },
                  { label: "Produk Aktif", value: String(stats.totalProducts), color: "text-pink-400", accent: "border-pink-500/20 bg-pink-500/5" },
                  { label: "Total Game", value: String(stats.totalGames), color: "text-violet-400", accent: "border-violet-500/20 bg-violet-500/5" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={item} whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-2xl transition-all ${stat.accent}`}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{stat.label}</p>
                    <h3 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Owner Revenue Chart */}
              {isOwner && (
                <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                  <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                    <TrendingUp className="h-5 w-5 text-emerald-400" /> Net Profit (Last 7 Days)
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ownerStats.dailyRevenue?.length > 0 ? ownerStats.dailyRevenue : [{ date: "N/A", revenue: 0, profit: 0, orderCount: 0 }]}>
                        <defs>
                          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FDB0C0" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FDB0C0" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickFormatter={(val) => val !== "N/A" ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : val} />
                        <YAxis stroke="#52525b" fontSize={10} tickFormatter={(v) => `Rp ${(v / 1000).toLocaleString()}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#FDB0C0" strokeWidth={3} fillOpacity={1} fill="url(#revGrad)" />
                        <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Transaction Summary */}
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
                      {isOwner && <th className="px-6 py-4 text-right">Profit</th>}
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
                        {isOwner && (
                          <td className="px-6 py-5 text-right text-sm font-bold text-emerald-400">
                            +{formatIDR(tx.profit)}
                          </td>
                        )}
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
                <button 
                  onClick={() => {
                    setEditingGame(null);
                    setGameFormData({
                      name: "",
                      slug: "",
                      publisher: "",
                      description: "",
                      type: "GAME",
                      currencyName: "Diamonds",
                      hasServerId: false,
                      isActive: true,
                      isHot: false,
                      thumbnail: ""
                    });
                    setShowGameModal(true);
                  }}
                  className="rounded-xl bg-sakura px-4 py-2 text-xs font-bold text-zinc-950 transition hover:scale-105"
                >
                  + Tambah Game
                </button>
              </div>

              {/* Game Table */}
              <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/20 shadow-2xl backdrop-blur-3xl">
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                      <tr>
                        <th className="px-6 py-4">Game</th>
                        <th className="px-6 py-4">Slug</th>
                        <th className="px-6 py-4">Publisher</th>
                        <th className="px-6 py-4">Currency</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {games.map((game) => (
                        <tr key={game.id} className="group transition-colors hover:bg-white/[0.02]">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden">
                                {game.thumbnail ? <img src={game.thumbnail} className="h-full w-full object-cover" /> : <Gamepad2 size={16} />}
                              </div>
                              <span className="text-xs font-bold text-white">{game.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-zinc-400">{game.slug}</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">{game.publisher || "-"}</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">{game.currencyName}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${game.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {game.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingGame(game);
                                  setGameFormData({
                                    name: game.name,
                                    slug: game.slug,
                                    publisher: game.publisher || "",
                                    currencyName: game.currencyName,
                                    description: game.description || "",
                                    thumbnail: game.thumbnail || "",
                                    type: game.type || "GAME",
                                    hasServerId: game.hasServerId,
                                    isActive: game.isActive,
                                    isHot: game.isHot
                                  });
                                  setShowGameModal(true);
                                }}
                                className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteGame(game.id)}
                                className="rounded-lg bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Game Modal */}
              <AnimatePresence>
                {showGameModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-zinc-900 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                      <h2 className="mb-6 text-xl font-black text-white">
                        {editingGame ? "Edit Game" : "Tambah Game Baru"}
                      </h2>
                      <form onSubmit={handleGameSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nama Game</label>
                            <input 
                              required
                              value={gameFormData.name}
                              onChange={(e) => setGameFormData({...gameFormData, name: e.target.value})}
                              className="w-full rounded-xl border border-white/5 bg-black/40 p-3 text-xs font-bold text-white outline-none focus:border-sakura"
                              placeholder="Mobile Legends"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</label>
                            <input 
                              required
                              value={gameFormData.slug}
                              onChange={(e) => setGameFormData({...gameFormData, slug: e.target.value})}
                              className="w-full rounded-xl border border-white/5 bg-black/40 p-3 text-xs font-bold text-white outline-none focus:border-sakura"
                              placeholder="mobile-legends"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Deskripsi Game</label>
                            <textarea 
                              value={gameFormData.description}
                              onChange={(e) => setGameFormData({...gameFormData, description: e.target.value})}
                              rows={3}
                              className="w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-xs font-bold text-white outline-none focus:border-sakura transition-all"
                              placeholder="Deskripsi menarik untuk game ini..."
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tipe Layanan</label>
                            <select 
                              value={gameFormData.type}
                              onChange={(e) => setGameFormData({...gameFormData, type: e.target.value})}
                              className="w-full rounded-xl border border-white/5 bg-black/40 p-3 text-xs font-bold text-white outline-none focus:border-sakura appearance-none"
                            >
                              <option value="GAME" className="bg-zinc-900">Top-Up Game</option>
                              <option value="VOUCHER" className="bg-zinc-900">Voucher Digital</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">URL Gambar (Icon)</label>
                            <input 
                              value={gameFormData.thumbnail}
                              onChange={(e) => setGameFormData({...gameFormData, thumbnail: e.target.value})}
                              className="w-full rounded-xl border border-white/5 bg-black/40 p-3 text-xs font-bold text-white outline-none focus:border-sakura"
                              placeholder="https://cloudinary.com/..."
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`flex h-5 w-5 items-center justify-center rounded border border-white/10 transition-all ${gameFormData.hasServerId ? "bg-sakura border-sakura" : "bg-black/40 group-hover:border-sakura/50"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.hasServerId}
                                onChange={(e) => setGameFormData({...gameFormData, hasServerId: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.hasServerId && <CheckCircle2 className="h-4 w-4 text-zinc-950" />}
                            </div>
                            <span className="text-[11px] font-black text-zinc-400 group-hover:text-white transition-colors">Butuh Server ID</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`flex h-5 w-5 items-center justify-center rounded border border-white/10 transition-all ${gameFormData.isActive ? "bg-emerald-500 border-emerald-500" : "bg-black/40 group-hover:border-emerald-500/50"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.isActive}
                                onChange={(e) => setGameFormData({...gameFormData, isActive: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.isActive && <CheckCircle2 className="h-4 w-4 text-zinc-950" />}
                            </div>
                            <span className="text-[11px] font-black text-zinc-400 group-hover:text-white transition-colors">Aktif</span>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`flex h-5 w-5 items-center justify-center rounded border border-white/10 transition-all ${gameFormData.isHot ? "bg-orange-500 border-orange-500" : "bg-black/40 group-hover:border-orange-500/50"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.isHot}
                                onChange={(e) => setGameFormData({...gameFormData, isHot: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.isHot && <CheckCircle2 className="h-4 w-4 text-zinc-950" />}
                            </div>
                            <span className="text-[11px] font-black text-zinc-400 group-hover:text-white transition-colors">🔥 Hot Game</span>
                          </label>
                        </div>

                        <div className="flex gap-3 pt-6">
                          <button 
                            type="button"
                            onClick={() => setShowGameModal(false)}
                            className="flex-1 rounded-2xl border border-white/5 bg-white/5 py-4 text-xs font-black text-white transition hover:bg-white/10"
                          >
                            Batal
                          </button>
                          <button 
                            type="submit"
                            disabled={isPending}
                            className="flex-1 rounded-2xl bg-sakura py-4 text-xs font-black text-zinc-950 shadow-[0_0_20px_rgba(253,176,192,0.3)] transition hover:scale-[1.02] disabled:opacity-50"
                          >
                            {isPending ? "Memproses..." : (editingGame ? "Simpan Perubahan" : "Buat Game")}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
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
