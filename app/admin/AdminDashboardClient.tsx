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
  Download,
  Flame,
  MessageSquare,
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
  getOwnerStats,
} from "@/app/actions/dashboard";
import { requestAnalyticsReportExport } from "@/app/actions/report";
import { ProviderStatus } from "@/lib/api-adapter";
import OpsStatusView from "./components/OpsStatusView";
import PaymentsTab from "./components/PaymentsTab";
import UsersTab from "./components/UsersTab";
import FlashSaleManager from "./components/FlashSaleManager";
import WhatsAppBlastManager from "./components/WhatsAppBlastManager";
import SettingsTab from "./components/SettingsTab";
import ProductCategoriesTab from "./components/ProductCategoriesTab";
import ProductManagerModal from "./components/ProductManagerModal";
import DeepAnalyticsTab from "./components/DeepAnalyticsTab";

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
  const [ownerStatsState, setOwnerStatsState] = useState<OwnerStats>(initialStats as OwnerStats);
  const adminStats = initialStats as AdminStats;

  const [stats] = useState(initialStats);
  const [timeFilter, setTimeFilter] = useState<number | undefined>(7);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [providerStatusesList, setProviderStatusesList] = useState(providerStatuses);
  const [games, setGames] = useState(initialGames);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalTransactions, setTotalTransactions] = useState(initialTotal);
  
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as any;
  
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "transactions" | "games" | "categories" | "payments" | "providers" | "ops" | "users" | "settings" | "flashsale">(
    ["overview", "analytics", "transactions", "games", "categories", "payments", "providers", "ops", "users", "settings", "flashsale"].includes(tabParam) ? tabParam : "overview"
  );
  
  const [searchGame, setSearchGame] = useState("");

  useEffect(() => {
    if (tabParam && ["overview", "analytics", "transactions", "games", "payments", "providers", "ops", "users", "settings"].includes(tabParam)) {
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
  const [manageProductsGame, setManageProductsGame] = useState<any>(null);
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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/notifications", {
        accessTokenFactory: () => document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] || ""
      }).withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
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
            // Auto refresh stats on payment success
            if (data.paymentStatus === "PAID" && isOwner) {
              getOwnerStats(timeFilter).then(stats => setOwnerStatsState(stats));
            }
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
  }, [isOwner, timeFilter]);

  const loadOwnerStats = async (days: number | undefined) => {
    setTimeFilter(days);
    const data = await getOwnerStats(days);
    setOwnerStatsState(data);
  };

  const handleExportEmail = async () => {
    const email = window.prompt("Masukkan alamat email untuk menerima laporan Excel:");
    if (!email) return;
    
    const loadingId = toast.loading("Memproses permintaan ekspor...");
    try {
      const res = await requestAnalyticsReportExport(email, timeFilter || 30);
      toast.dismiss(loadingId);
      if (res.success) {
        toast.success(res.message || "Laporan sedang dikirim.");
      } else {
        toast.error(res.message || "Gagal memproses ekspor.");
      }
    } catch (e: any) {
      toast.dismiss(loadingId);
      toast.error("Terjadi kesalahan jaringan saat request export.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await import("@/app/actions/report").then(m => m.downloadCsvReport(timeFilter || 30));
      if (!res.success) {
        toast.error(res.error || "Gagal mengunduh CSV");
        return;
      }
      
      const blob = new Blob([res.data || ""], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_SassyGurl_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("CSV berhasil diunduh");
    } catch (err: any) {
      toast.error("Terjadi kesalahan saat mengunduh CSV");
    }
  };

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
        ...(isOwner ? [{ id: "analytics", label: "Analitik Visual", icon: TrendingUp }] : []),
        { id: "transactions", label: "Transaksi", icon: History },
      ]
    },
    {
      title: "Management",
      items: [
        ...(isOwner || role?.toUpperCase() === "CS" ? [{ id: "users", label: "Kelola User", icon: Users }] : []),
        ...(isOwner ? [
          { id: "games", label: "Kelola Game", icon: Gamepad2 },
          { id: "categories", label: "Kategori Produk", icon: Package },
          { id: "flashsale", label: "Flash Sale", icon: Flame }
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
        ] : []),
        { id: "livechat", label: "Live Chat", icon: MessageSquare, href: "/admin/livechat" }
      ]
    }
  ];

  return (
    <div className="relative flex min-h-screen bg-zinc-950 text-white overflow-hidden">
      
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl md:flex">
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
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
                      
                      const Element = tab.href ? "a" : "button";
                      const props = tab.href 
                        ? { href: tab.href, key: tab.id } 
                        : { onClick: () => setActiveTab(tab.id as any), key: tab.id };
                        
                      return (
                        <Element
                          {...props}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                            isActive 
                              ? "bg-sakura/10 text-sakura shadow-[inset_2px_0_0_0,rgba(253,176,192,1)]" 
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                          }`}
                        >
                          <tab.icon className={`h-4 w-4 ${isActive ? "text-sakura" : "text-zinc-500"}`} />
                          {tab.label}
                        </Element>
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
                <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-status-success">{role || "SUPERADMIN"}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-status-danger/10 px-4 py-2.5 text-xs font-bold text-status-danger transition hover:bg-status-danger/20 active:scale-95"
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
             <button onClick={handleLogout} className="p-2 text-status-danger bg-status-danger/10 rounded-lg">
               <LogOut className="h-4 w-4" />
             </button>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {navGroups.flatMap(g => g.items).map(tab => {
                const isActive = activeTab === tab.id;
                const Element = tab.href ? "a" : "button";
                const props = tab.href 
                  ? { href: tab.href, key: tab.id } 
                  : { onClick: () => setActiveTab(tab.id as any), key: tab.id };
                return (
                  <Element
                    {...props}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                      isActive 
                        ? "bg-sakura/10 text-sakura border border-sakura/20 shadow-[0_0_10px_rgba(253,176,192,0.1)]" 
                        : "text-zinc-400 bg-zinc-900/50 border border-zinc-800"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Element>
                );
             })}
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
                          <div className={`h-3 w-3 rounded-full ${ps.isActive ? "bg-status-success shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-status-danger animate-pulse"}`} />
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
                    <button onClick={() => toast.info("Fitur Catalog Health akan segera hadir!")} className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95">
                      <span>Catalog Health</span>
                      <Activity className="h-4 w-4 text-status-success" />
                    </button>
                    <button onClick={() => toast.info("Fitur Review Queue akan segera hadir!")} className="flex w-full items-center justify-between rounded-xl bg-white/5 p-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95">
                      <span>Review Queue</span>
                      <ShieldCheck className="h-4 w-4 text-status-warning" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Filter Row and Export */}
              {isOwner && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {[
                      { label: "Hari ini", value: 1 },
                      { label: "7 Hari", value: 7 },
                      { label: "30 Hari", value: 30 },
                      { label: "Semua", value: undefined }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => loadOwnerStats(opt.value)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${timeFilter === opt.value ? "bg-sakura text-obsidian shadow-[0_0_15px_rgba(253,176,192,0.3)]" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportEmail}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors"
                    >
                      <UploadCloud size={14} /> Ke Email
                    </button>
                    <button 
                      onClick={handleExportCsv}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-cyan/20 border border-brand-cyan/50 hover:bg-brand-cyan/30 rounded-lg text-xs font-bold text-brand-cyan transition-colors"
                    >
                      <Download size={14} /> Download CSV
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ...(isOwner ? [
                    { label: "Total Omzet", value: formatIDR(ownerStatsState.totalRevenue), color: "text-white", accent: "border-sakura/20 bg-sakura/5" },
                    { label: "Laba Bersih", value: formatIDR(ownerStatsState.netProfit), color: "text-status-success", accent: "border-status-success/20 bg-status-success/5" },
                    { label: "Omzet Hari Ini", value: formatIDR(ownerStatsState.todayRevenue), color: "text-brand-cyan", accent: "border-brand-cyan/20 bg-brand-cyan/5" },
                  ] : []),
                  { label: "Total Member", value: String(stats.totalUsers), color: "text-status-warning", accent: "border-status-warning/20 bg-status-warning/5" },
                  { label: "Produk Aktif", value: String(stats.totalProducts), color: "text-pink-400", accent: "border-pink-500/20 bg-pink-500/5" },
                  { label: "Total Game", value: String(stats.totalGames), color: "text-violet-400", accent: "border-violet-500/20 bg-violet-500/5" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={item} whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-2xl transition-all ${stat.accent}`}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{stat.label}</p>
                    <h3 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                  </motion.div>
                ))}
              </div>
              
              {/* Owner Revenue Chart & Top Games PieChart */}
              {isOwner && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                    <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                      <TrendingUp className="h-5 w-5 text-status-success" /> Financial Radar
                    </h3>
                    <div className="min-h-[300px] w-full" style={{ position: 'relative' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={ownerStatsState.dailyRevenue?.length > 0 ? ownerStatsState.dailyRevenue : [{ date: "N/A", revenue: 0, profit: 0, orderCount: 0 }]}>
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

                  <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                    <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                      <Gamepad2 className="h-5 w-5 text-sakura" /> Top Game Terlaris
                    </h3>
                    {ownerStatsState.topGames?.length > 0 ? (
                      <div className="space-y-4 mt-6">
                        {ownerStatsState.topGames.map((game, i) => (
                          <div key={i} className="flex flex-col gap-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white truncate max-w-[150px]">{game.gameName}</span>
                                <span className="text-sakura font-bold">{formatIDR(game.totalSales)}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                                <span>{game.orderCount} Transaksi</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-sakura rounded-full" style={{ width: `${(game.totalSales / ownerStatsState.topGames[0].totalSales) * 100}%` }} />
                              </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                        Belum ada data penjualan.
                      </div>
                    )}
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
                    { label: "Sukses", count: stats.successTransactions, color: "text-status-success bg-status-success/10 border-status-success/20" },
                    { label: "Pending", count: stats.pendingTransactions, color: "text-status-warning bg-status-warning/10 border-status-warning/20" },
                    { label: "Gagal", count: stats.failedTransactions, color: "text-status-danger bg-status-danger/10 border-status-danger/20" },
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

          {/* ═══════════════ TAB: ANALYTICS (OWNER ONLY) ═══════════════ */}
          {activeTab === "analytics" && isOwner && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Filter Row and Export */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                  {[
                    { label: "Hari ini", value: 1 },
                    { label: "7 Hari", value: 7 },
                    { label: "30 Hari", value: 30 },
                    { label: "Semua", value: undefined }
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => loadOwnerStats(opt.value)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${timeFilter === opt.value ? "bg-sakura text-obsidian shadow-[0_0_15px_rgba(253,176,192,0.3)]" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={handleExportEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-status-success/10 border border-status-success/20 hover:bg-status-success/20 rounded-lg text-xs font-bold text-status-success transition-colors"
                >
                  <Download size={14} /> Export Laporan Excel ke Email
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Omzet", value: formatIDR(ownerStatsState.totalRevenue), color: "text-white", accent: "border-sakura/20 bg-sakura/5" },
                  { label: "Laba Bersih", value: formatIDR(ownerStatsState.netProfit), color: "text-status-success", accent: "border-status-success/20 bg-status-success/5" },
                  { label: "Omzet Hari Ini", value: formatIDR(ownerStatsState.todayRevenue), color: "text-brand-cyan", accent: "border-brand-cyan/20 bg-brand-cyan/5" },
                  { label: "Total Transaksi", value: String(ownerStatsState.totalTransactions), color: "text-status-warning", accent: "border-status-warning/20 bg-status-warning/5" },
                ].map((stat, i) => (
                  <motion.div key={i} variants={item} whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-2xl transition-all ${stat.accent}`}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{stat.label}</p>
                    <h3 className={`text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
                  </motion.div>
                ))}
              </div>
              
              {/* Owner Revenue Chart & Top Games PieChart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                  <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                    <TrendingUp className="h-5 w-5 text-status-success" /> Omzet vs Keuntungan
                  </h3>
                  <div className="min-h-[400px] w-full" style={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={ownerStatsState.dailyRevenue?.length > 0 ? ownerStatsState.dailyRevenue : [{ date: "N/A", revenue: 0, profit: 0, orderCount: 0 }]}>
                        <defs>
                          <linearGradient id="profitGradAnalytic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="revGradAnalytic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FDB0C0" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#FDB0C0" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickFormatter={(val) => val !== "N/A" ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : val} />
                        <YAxis stroke="#52525b" fontSize={10} tickFormatter={(v) => `Rp ${(v / 1000).toLocaleString()}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="revenue" name="Omzet" stroke="#FDB0C0" strokeWidth={3} fillOpacity={1} fill="url(#revGradAnalytic)" />
                        <Area type="monotone" dataKey="profit" name="Laba Bersih" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGradAnalytic)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/20 p-8 backdrop-blur-2xl">
                  <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
                    <Gamepad2 className="h-5 w-5 text-sakura" /> Peringkat Game Terlaris
                  </h3>
                  {ownerStatsState.topGames?.length > 0 ? (
                    <div className="space-y-6 mt-6">
                      {ownerStatsState.topGames.map((game, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-black text-white truncate max-w-[150px]">
                                {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                                {game.gameName}
                              </span>
                              <span className="text-sakura font-black">{formatIDR(game.totalSales)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                              <span>{game.orderCount} Transaksi Sukses</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-sakura rounded-full relative overflow-hidden" style={{ width: `${(game.totalSales / ownerStatsState.topGames[0].totalSales) * 100}%` }}>
                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                              </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                      Belum ada data penjualan.
                    </div>
                  )}
                </div>
              </div>
              <DeepAnalyticsTab />
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
                <table className="hidden w-full text-left md:table">
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
                          <td className="px-5 py-4 text-right font-mono text-sm text-status-success">
                            +{formatIDR(tx.profit)}
                          </td>
                        )}
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {tx.orderStatus === "PENDING" && (
                              <button
                                onClick={() => handleStatusUpdate(tx.id, "PROCESSING")}
                                className="rounded-lg border border-status-warning/20 bg-status-warning/10 px-3 py-1.5 text-[10px] font-bold text-status-warning transition hover:bg-status-warning/20"
                              >
                                Process
                              </button>
                            )}
                            {(tx.orderStatus === "PENDING" || tx.orderStatus === "PROCESSING" || tx.orderStatus === "ERROR") && (
                              <button
                                onClick={() => handleStatusUpdate(tx.id, "SUCCESS")}
                                className="rounded-lg border border-status-success/20 bg-status-success/10 px-3 py-1.5 text-[10px] font-bold text-status-success transition hover:bg-status-success/20"
                              >
                                ✓ Done
                              </button>
                            )}
                            {(tx.orderStatus === "ERROR" || tx.orderStatus === "PENDING") && (
                              <button
                                onClick={() => {
                                  toast.promise(
                                    handleStatusUpdate(tx.id, "PROCESSING"),
                                    {
                                      loading: 'Auto-Healing diproses... Sinkronisasi API',
                                      success: 'Auto-Healing berhasil! Status: PROCESSING',
                                      error: 'Gagal melakukan Auto-Heal'
                                    }
                                  );
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

                {/* Mobile View */}
                <div className="space-y-4 md:hidden">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="space-y-5 rounded-3xl border border-white/10 bg-zinc-900/50 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-zinc-500">{tx.invoiceId}</div>
                          <div className="mt-1 text-sm font-black uppercase text-white">{tx.gameName}</div>
                        </div>
                        <AdminStatusBadge status={tx.orderStatus} />
                      </div>
                      <div className="flex items-end justify-between border-t border-white/10 pt-4">
                        <div>
                          <div className="text-[10px] font-bold italic text-zinc-500">{tx.productName}</div>
                          <div className="mt-1 text-lg font-black tracking-tighter text-white">{formatIDR(tx.amount)}</div>
                          {isOwner && (
                            <div className="mt-1 text-xs font-black text-status-success">+{formatIDR(tx.profit)} Profit</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {tx.orderStatus === "PENDING" && (
                            <button onClick={() => handleStatusUpdate(tx.id, "PROCESSING")} className="rounded-lg border border-status-warning/20 bg-status-warning/10 px-3 py-1.5 text-[10px] font-bold text-status-warning">Process</button>
                          )}
                          {(tx.orderStatus === "PENDING" || tx.orderStatus === "PROCESSING" || tx.orderStatus === "ERROR") && (
                            <button onClick={() => handleStatusUpdate(tx.id, "SUCCESS")} className="rounded-lg border border-status-success/20 bg-status-success/10 px-3 py-1.5 text-[10px] font-bold text-status-success">✓ Done</button>
                          )}
                          {(tx.orderStatus === "ERROR" || tx.orderStatus === "PENDING") && (
                            <button onClick={() => toast.promise(handleStatusUpdate(tx.id, "PROCESSING"), { loading: 'Healing...', success: 'Healed!' })} className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold text-cyan-400">⚡ Heal</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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
                            <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${game.isActive ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger"}`}>
                              {game.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setManageProductsGame(game)}
                                title="Kelola Item/Produk"
                                className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-amber-500/20 hover:text-amber-500 shadow-sm"
                              >
                                <Package size={14} />
                              </button>
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
                                title="Edit Game"
                                className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-sakura/20 hover:text-sakura shadow-sm hover:shadow-[0_0_10px_rgba(253,176,192,0.2)]"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteGame(game.id)}
                                title="Hapus Game"
                                className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:bg-status-danger/20 hover:text-status-danger shadow-sm"
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
                            <div className={`relative flex items-center justify-center w-6 h-6 rounded border transition-colors shrink-0 mt-0.5 ${gameFormData.isActive ? "border-status-success bg-status-success/10" : "border-white/20 bg-black/40 group-hover:border-status-success"}`}>
                              <input 
                                type="checkbox"
                                checked={gameFormData.isActive}
                                onChange={(e) => setGameFormData({...gameFormData, isActive: e.target.checked})}
                                className="hidden"
                              />
                              {gameFormData.isActive && <CheckCircle2 className="h-5 w-5 text-status-success" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-status-success transition-colors">Status Aktif</span>
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

              {manageProductsGame && (
                <ProductManagerModal 
                  game={manageProductsGame} 
                  onClose={() => setManageProductsGame(null)} 
                />
              )}
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

          {/* ═══════════════ TAB: FLASH SALE ═══════════════ */}
          {activeTab === "flashsale" && isOwner && (
            <motion.div
              key="flashsale"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <FlashSaleManager games={games} />
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
                {providerStatusesList.map((provider) => (
                  <div
                    key={provider.name}
                    className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-2xl"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-black text-white">{provider.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[10px] font-bold ${
                          provider.isActive
                            ? "border-status-success/20 bg-status-success/10 text-status-success"
                            : "border-status-danger/20 bg-status-danger/10 text-status-danger"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${provider.isActive ? "bg-status-success" : "bg-status-danger"}`} />
                        {provider.isActive ? "ACTIVE" : "DOWN"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Success Rate</p>
                        <p className="mt-2 text-2xl font-black text-status-success">
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
      ? { color: "bg-status-success/10 text-status-success border-status-success/20", icon: CheckCircle2 }
      : status === "PROCESSING"
        ? { color: "bg-status-info/10 text-status-info border-status-info/20", icon: RefreshCw }
        : status === "PENDING"
          ? { color: "bg-status-warning/10 text-status-warning border-status-warning/20", icon: Clock }
          : { color: "bg-status-danger/10 text-status-danger border-status-danger/20", icon: XCircle };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black ${config.color}`}>
      <config.icon className="h-3 w-3" />
      {status}
    </span>
  );
}
