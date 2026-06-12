"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useTransition, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { signOut } from "next-auth/react";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";
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
  LogOut,
  Settings,
  UploadCloud,
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
import OpsStatusView from "./components/OpsStatusView";
import PaymentsTab from "./components/PaymentsTab";
import UsersTab from "./components/UsersTab";
import SettingsTab from "./components/SettingsTab";
import ProductCategoriesTab from "./components/ProductCategoriesTab";

type Props = {
  initialStats: OwnerStats | AdminStats;
  initialTransactions: AdminTransaction[];
  initialTotal?: number;
  providerStatuses: ProviderStatus[];
  initialGames: any[];
  role: string;
};

function ImageUploadField({ label, value, onChange, placeholder, aspectRatio = "square" }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, aspectRatio?: "square" | "video" }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar. Maksimal 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        onChange(data.url);
        toast.success("Gambar berhasil diunggah");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</label>
      <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-black/40 hover:bg-black/60 hover:border-sakura/50 transition-all overflow-hidden ${aspectRatio === "square" ? "aspect-square w-32" : "aspect-video w-full"}`}>
        {value ? (
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center p-4 text-center">
            {isUploading ? (
              <RefreshCw className="h-6 w-6 text-sakura animate-spin" />
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-zinc-600 mb-2" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Click to<br/>Upload</span>
              </>
            )}
          </div>
        )}
        <input 
          type="file" 
          accept="image/*"
          onChange={handleUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        {value && !isUploading && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
            <span className="text-[10px] font-bold text-white bg-black/80 px-2 py-1 rounded">Ganti</span>
          </div>
        )}
      </div>
      <input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/5 bg-black/40 p-3 text-xs font-bold text-white outline-none focus:border-sakura mt-2"
        placeholder={placeholder}
      />
    </div>
  );
}

export default function AdminDashboardClient({ initialStats, initialTransactions, initialTotal = 0, providerStatuses, initialGames, role }: Props) {
  const isOwner = role?.toUpperCase() === "SUPERADMIN" || role?.toUpperCase() === "OWNER";
  const ownerStats = initialStats as OwnerStats;
  const adminStats = initialStats as AdminStats;

  const [stats] = useState(initialStats);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [providerStatusesList, setProviderStatusesList] = useState(providerStatuses);
  const [games, setGames] = useState(initialGames);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalTransactions, setTotalTransactions] = useState(initialTotal);
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;
  
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "games" | "categories" | "payments" | "providers" | "ops" | "users" | "settings">(
    ["overview", "transactions", "games", "categories", "payments", "providers", "ops", "users", "settings"].includes(tabParam) ? tabParam : "overview"
  );
  
  const [searchGame, setSearchGame] = useState("");

  useEffect(() => {
    if (tabParam && ["overview", "transactions", "games", "payments", "providers", "ops", "users", "settings"].includes(tabParam)) {
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
    thumbnail: "",
    banner: ""
  });

  const handleSync = async () => {
    setIsSyncing(true);
    const res = await triggerCatalogSync();
    alert(res.message);
    setIsSyncing(false);
  };

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let mounted = true;
    if (connectionRef.current) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`)
      .configureLogging(signalR.LogLevel.Warning)
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connectionRef.current = connection;

    connection.on("TransactionUpdated", (data: any) => {
      setTransactions((prev) => {
        const idx = prev.findIndex((t) => t.id === data.transactionId);
        if (idx !== -1) {
          const updated = [...prev];
          const oldStatus = updated[idx].paymentStatus;
          updated[idx] = {
            ...updated[idx],
            paymentStatus: data.paymentStatus,
            orderStatus: data.orderStatus,
          };

          if (oldStatus !== data.paymentStatus) {
            toast.success(`Admin: Transaksi #${data.transactionId.substring(0, 5)}... Diperbarui!`, {
              description: `Status: ${data.paymentStatus}`,
            });
          }

          return updated;
        }
        return prev;
      });
    });

    connection.on("NewTransaction", (data: any) => {
      setTransactions((prev) => {
        if (prev.some(t => t.id === data.id)) return prev;
        
        toast.info(`Admin: Transaksi Baru Masuk!`, {
          description: `Produk: ${data.productName} (${data.amount} IDR)`,
        });

        return [{
          id: data.id,
          invoiceId: data.invoiceId || "INV-NEW",
          date: new Date().toISOString(),
          customer: data.customerIdentifier || "Unknown",
          customerPhone: data.customerPhone || "N/A",
          gameName: data.gameName || "Unknown Game",
          productName: data.productName,
          targetId: data.targetId || "N/A",
          amount: data.amount,
          paymentStatus: data.paymentStatus || "PENDING",
          orderStatus: data.orderStatus,
          providerRef: data.providerRef,
          profit: 0, 
          createdAt: data.updatedAt
        }, ...prev];
      });
    });

    connection.on("ProviderStatusChanged", (data: any) => {
      setProviderStatusesList((prev) => {
        const idx = prev.findIndex((p) => p.name === data.providerName);
        if (idx !== -1) {
          const updated = [...prev];
          const oldStatus = updated[idx].isActive;
          updated[idx] = { 
            ...updated[idx], 
            isActive: data.isActive, 
            avgLatency: data.latency, 
            successRate: data.successRate 
          };
          
          if (oldStatus !== data.isActive) {
            if (data.isActive) toast.success(`Provider ${data.providerName} is back ONLINE!`);
            else toast.error(`Provider ${data.providerName} is OFFLINE!`);
          }
          return updated;
        }
        // If not found in initial array, append it (unlikely but safe)
        return [...prev, {
            name: data.providerName,
            isActive: data.isActive,
            balance: 0,
            avgLatency: data.latency,
            successRate: data.successRate,
            lastChecked: data.checkedAt
        }];
      });
    });

    connection.start().catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);
    setPage(1);
    startTransition(async () => {
      const { transactions: result, total } = await getAdminTransactions(newFilter, search, 1, perPage);
      setTransactions(result);
      setTotalTransactions(total);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    startTransition(async () => {
      const { transactions: result, total } = await getAdminTransactions(filter, value, 1, perPage);
      setTransactions(result);
      setTotalTransactions(total);
    });
  }
  
  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > Math.ceil(totalTransactions / perPage)) return;
    setPage(newPage);
    startTransition(async () => {
      const { transactions: result, total } = await getAdminTransactions(filter, search, newPage, perPage);
      setTransactions(result);
      setTotalTransactions(total);
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
        toast.success(editingGame ? "Game updated!" : "Game created!");
        setShowGameModal(false);
        setEditingGame(null);
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  }

  async function handleDeleteGame(id: string) {
    if (!confirm("Are you sure you want to delete this game?")) return;
    startTransition(async () => {
      const res = await deleteGame(id);
      if (res.success) {
        toast.success("Game deleted");
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  }


  const handleLogout = async () => {
    try {
      await logoutAction();
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error("Error clearing C# session", e);
    } finally {
      await signOut({ redirect: true, callbackUrl: "/auth/login" });
    }
  };

  const navGroups = [
    {
      title: "Main",
      items: [
        { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
        { id: "transactions", label: "Transaksi", icon: History },
      ]
    },
    {
      title: "Management",
      items: [
        ...(isOwner || role?.toUpperCase() === "CS" ? [{ id: "users", label: "Kelola User", icon: Users }] : []),
        ...(isOwner ? [
          { id: "games", label: "Kelola Game", icon: Gamepad2 },
          { id: "categories", label: "Kategori Produk", icon: Package }
        ] : []),
      ]
    },
    {
      title: "System & Ops",
      items: [
        ...(isOwner ? [
          { id: "payments", label: "Payment Gateway", icon: DollarSign },
          { id: "providers", label: "Provider Status", icon: Megaphone },
          { id: "settings", label: "Sistem Settings", icon: Settings },
          { id: "ops", label: "Ops Status", icon: Zap },
        ] : [])
      ]
    }
  ];

  return (
    <div className="relative flex min-h-screen bg-zinc-950 text-white overflow-hidden">
      
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl md:flex">
        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sakura to-pink-600 shadow-[0_0_15px_rgba(253,176,192,0.3)]">
              <ShieldCheck className="h-5 w-5 text-zinc-950" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">SASSY<span className="text-sakura">GURL</span></span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Command Center</p>
            </div>
          </div>

          <div className="space-y-8">
            {navGroups.map((group, idx) => {
              if (group.items.length === 0) return null;
              return (
                <div key={idx}>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                            isActive 
                              ? "bg-sakura/10 text-sakura shadow-[inset_2px_0_0_0_rgba(253,176,192,1)]" 
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                          }`}
                        >
                          <tab.icon className={`h-4 w-4 ${isActive ? "text-sakura" : "text-zinc-500"}`} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto border-t border-zinc-800 p-6">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 font-black text-white">
              {(role || "U")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">Administrator</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">{role || "SUPERADMIN"}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-500 transition hover:bg-red-500/20 active:scale-95"
          >
            <LogOut className="h-4 w-4" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="relative flex-1 h-screen overflow-y-auto md:ml-64">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-sakura/5 blur-[120px]" />
        
        {/* Mobile Nav (Horizontal Scroll fallback for mobile) */}
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-xl sticky top-0 z-40">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sakura" />
                <span className="font-black text-white">SASSY<span className="text-sakura">GURL</span></span>
             </div>
             <button onClick={handleLogout} className="p-2 text-red-500 bg-red-500/10 rounded-lg">
               <LogOut className="h-4 w-4" />
             </button>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             {navGroups.flatMap(g => g.items).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === tab.id ? "bg-sakura/10 text-sakura border border-sakura/20" : "bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {tab.label}
                </button>
             ))}
           </div>
        </div>

        <div className="mx-auto max-w-[1200px] p-4 pt-6 md:p-10 pb-20">
          {/* Header Area in Main Content */}
          <motion.div variants={item} initial="hidden" animate="show" className="mb-10 hidden md:block">
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl capitalize">
              {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || "Dashboard"}
            </h1>
            <p className="text-sm text-zinc-500 font-medium mt-2">Manage your platform efficiently.</p>
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
                    {providerStatusesList.map((ps: any) => (
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
                    <a href="/admin/catalog-health" className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10">
                      <span>Catalog Health</span>
                      <Activity className="h-4 w-4 text-emerald-400" />
                    </a>
                    <a href="/admin/review" className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10">
                      <span>Review Queue</span>
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                    </a>
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
                  <div className="min-h-[300px] w-full" style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={300}>
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
                          ? "bg-zinc-800 text-white border border-white/10"
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
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="group transition-colors hover:bg-[#1a1a1e] border-b border-white/[0.02] last:border-0">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-black text-white transition-colors group-hover:text-sakura">
                            {tx.invoiceId}
                          </div>
                          <div className="mt-1 text-[10px] text-zinc-600">
                            {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-zinc-200">{tx.gameName}</div>
                          <div className="mt-0.5 text-[10px] italic text-zinc-500">{tx.productName}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-zinc-400">{tx.targetId}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <AdminStatusBadge status={tx.orderStatus} />
                        </td>
                        <td className="px-5 py-4 text-right font-mono text-sm text-zinc-200">
                          {formatIDR(tx.amount)}
                        </td>
                        {isOwner && (
                          <td className="px-5 py-4 text-right font-mono text-sm text-emerald-400">
                            +{formatIDR(tx.profit)}
                          </td>
                        )}
                        <td className="px-5 py-4 text-center">
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
                
                {transactions.length > 0 && (
                  <div className="flex items-center justify-between border-t border-white/5 bg-zinc-900/50 p-4 backdrop-blur-md">
                    <span className="text-xs font-bold text-zinc-500">
                      Menampilkan {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalTransactions)} dari {totalTransactions} transaksi
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                        className="rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-30"
                      >
                        Prev
                      </button>
                      <span className="text-xs font-bold text-white px-2">Page {page}</span>
                      <button 
                        disabled={page >= Math.ceil(totalTransactions / perPage)}
                        onClick={() => handlePageChange(page + 1)}
                        className="rounded-lg bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
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
                  <Gamepad2 className="h-5 w-5 text-sakura" /> Manajemen Game & Katalog <span className="text-[10px] text-zinc-400 font-bold bg-white/5 px-2 py-0.5 rounded-full lowercase tracking-normal">({games.length} games)</span>
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
                      thumbnail: "",
                      banner: ""
                    });
                    setShowGameModal(true);
                  }}
                  className="rounded-xl bg-sakura px-4 py-2 text-xs font-bold text-zinc-950 transition hover:scale-105"
                >
                  + Tambah Game
                </button>
              </div>

              {/* Game Table */}
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cari Game berdasarkan nama..."
                    value={searchGame}
                    onChange={(e) => setSearchGame(e.target.value)}
                    className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-sakura"
                  />
                </div>
              </div>
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
                    <tbody>
                      {games.filter(g => g.name.toLowerCase().includes(searchGame.toLowerCase())).map((game) => (
                        <tr key={game.id} className="group transition-colors hover:bg-[#1a1a1e] border-b border-white/[0.02] last:border-0">
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
                                    banner: game.banner || "",
                                    type: game.type || "GAME",
                                    hasServerId: game.hasServerId,
                                    isActive: game.isActive,
                                    isHot: game.isHot
                                  });
                                  setShowGameModal(true);
                                }}
                                className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-sakura/20 hover:text-sakura shadow-sm hover:shadow-[0_0_10px_rgba(253,176,192,0.2)]"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteGame(game.id)}
                                className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-red-500/20 hover:text-red-400 shadow-sm"
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
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl max-h-[90vh] overflow-y-auto"
                    >
                      <h2 className="mb-6 text-2xl font-black text-white flex items-center gap-3">
                        <Gamepad2 className="w-8 h-8 text-sakura" />
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
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <ImageUploadField
                            label="URL Gambar (Icon)"
                            value={gameFormData.thumbnail}
                            onChange={(v) => setGameFormData({...gameFormData, thumbnail: v})}
                            placeholder="Upload icon atau paste URL..."
                            aspectRatio="square"
                          />
                          <ImageUploadField
                            label="URL Banner"
                            value={gameFormData.banner}
                            onChange={(v) => setGameFormData({...gameFormData, banner: v})}
                            placeholder="Upload banner atau paste URL..."
                            aspectRatio="video"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 pt-4">
                          <label className="flex items-start gap-4 p-4 cursor-pointer group bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl transition-all">
                            <div className={`relative flex items-center justify-center w-6 h-6 rounded border transition-colors shrink-0 mt-0.5 ${gameFormData.hasServerId ? "border-sakura bg-sakura/10" : "border-white/20 bg-black/40 group-hover:border-sakura"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.hasServerId}
                                onChange={(e) => setGameFormData({...gameFormData, hasServerId: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.hasServerId && <CheckCircle2 className="h-5 w-5 text-sakura" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-sakura transition-colors">Butuh Server ID / Zone ID</span>
                              <span className="text-[11px] font-medium text-white/40 mt-1 leading-relaxed">Centang ini jika game memerlukan Server ID atau Zone ID tambahan selain ID utama pengguna (misal: Mobile Legends).</span>
                            </div>
                          </label>

                          <label className="flex items-start gap-4 p-4 cursor-pointer group bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl transition-all">
                            <div className={`relative flex items-center justify-center w-6 h-6 rounded border transition-colors shrink-0 mt-0.5 ${gameFormData.isActive ? "border-emerald-500 bg-emerald-500/10" : "border-white/20 bg-black/40 group-hover:border-emerald-500"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.isActive}
                                onChange={(e) => setGameFormData({...gameFormData, isActive: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.isActive && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">Status Aktif</span>
                              <span className="text-[11px] font-medium text-white/40 mt-1 leading-relaxed">Nonaktifkan untuk menyembunyikan game ini dari halaman utama agar tidak bisa dibeli oleh pelanggan.</span>
                            </div>
                          </label>

                          <label className="flex items-start gap-4 p-4 cursor-pointer group bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] rounded-2xl transition-all">
                            <div className={`relative flex items-center justify-center w-6 h-6 rounded border transition-colors shrink-0 mt-0.5 ${gameFormData.isHot ? "border-orange-500 bg-orange-500/10" : "border-white/20 bg-black/40 group-hover:border-orange-500"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.isHot}
                                onChange={(e) => setGameFormData({...gameFormData, isHot: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.isHot && <CheckCircle2 className="h-5 w-5 text-orange-500" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-orange-400 transition-colors flex items-center gap-2">
                                🔥 Hot Game Label
                              </span>
                              <span className="text-[11px] font-medium text-white/40 mt-1 leading-relaxed">Berikan emblem "Hot Game" pada banner game ini di halaman katalog untuk menarik perhatian.</span>
                            </div>
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

          {/* ═══════════════ TAB: CATEGORIES ═══════════════ */}
          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ProductCategoriesTab games={games} />
            </motion.div>
          )}

          {/* ═══════════════ TAB: PAYMENTS ═══════════════ */}
          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PaymentsTab />
            </motion.div>
          )}

          {/* ═══════════════ TAB: USERS ═══════════════ */}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <UsersTab role={role} />
            </motion.div>
          )}

          {/* ═══════════════ TAB: SETTINGS ═══════════════ */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SettingsTab />
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
                        <p className="mt-2 text-2xl font-black text-emerald-400">
                          {provider.successRate < 0 ? "N/A" : `${provider.successRate}%`}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Avg Latency</p>
                        <p className="mt-2 text-2xl font-black text-white">
                          {provider.avgLatency < 0 ? "N/A" : `${provider.avgLatency}ms`}
                        </p>
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

          {/* ═══════════════ TAB: OPS ═══════════════ */}
          {activeTab === "ops" && (
            <motion.div
              key="ops"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <OpsStatusView />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
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
