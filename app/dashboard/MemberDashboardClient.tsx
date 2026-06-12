"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { signOut } from "next-auth/react";
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
  LogOut,
  User,
  Shield,
  CreditCard,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { formatIDR, featuredGames } from "@/lib/catalog";
import {
  type DashboardStats,
  type RecentTransaction,
  getMemberTransactions,
} from "@/app/actions/dashboard";
import * as signalR from "@microsoft/signalr";
import { toast } from "sonner";

interface Props {
  initialStats: DashboardStats;
  initialTransactions: RecentTransaction[];
  session: any;
}

function triggerConfetti() {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    for(let i=0; i<10; i++) {
        const el = document.createElement('div');
        el.className = 'fixed pointer-events-none z-[100] h-2 w-2 rounded-full bg-sakura';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.top = '-10px';
        el.style.opacity = Math.random().toString();
        el.style.transform = `scale(${Math.random()})`;
        document.body.appendChild(el);
        
        const animation = el.animate([
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(100vh) rotate(720deg)`, opacity: 0 }
        ], {
            duration: randomInRange(2000, 4000),
            easing: 'cubic-bezier(0, .9, .57, 1)'
        });
        animation.onfinish = () => el.remove();
    }
  }, 250);
}

export default function MemberDashboardClient({ initialStats, initialTransactions, session }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "overview";
  
  const [activeTab, setActiveTab] = useState(tabParam);
  const [stats] = useState(initialStats);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

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

  const router = useRouter();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (connectionRef.current) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/notifications", {
        accessTokenFactory: () => document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] || ""
      })
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
            toast.success(`Transaksi #${data.transactionId.substring(0, 5)}... Diperbarui!`, {
              description: `Status: ${data.paymentStatus}`,
            });
          }

          if (data.paymentStatus === "PAID" && oldStatus !== "PAID") {
             triggerConfetti();
          }

          return updated;
        }
        return prev;
      });
    });

    const startConnection = async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start();
          console.log("Connected to Real-Time Hub");
        }
      } catch (err) {
        console.error("SignalR Connection Error:", err);
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [session, router]);

  const [trackInvoice, setTrackInvoice] = useState("");

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050508]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Settings className="h-8 w-8 text-sakura" />
        </motion.div>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const navGroups = [
    {
      title: "Main Menu",
      items: [
        { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
        { id: "transactions", label: "Riwayat Transaksi", icon: History },
      ]
    },
    {
      title: "Keuangan",
      items: [
        { id: "wallet", label: "Dompet Sassy", icon: Wallet },
      ]
    },
    {
      title: "Akun",
      items: [
        { id: "settings", label: "Pengaturan Profil", icon: Settings },
      ]
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* ═══════════════ TOP ROW (Profile & Tracking) ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROFILE CARD */}
        <motion.div variants={item} className="lg:col-span-1 flex flex-col justify-between rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-5 mb-6">
             <div className="h-16 w-16 shrink-0 rounded-full border-2 border-white/10 overflow-hidden bg-black relative">
                <img src={session?.user?.image || "/images/default-avatar.png"} alt="Avatar" className="h-full w-full object-cover" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white">{session?.user?.name || "Member"}</h3>
                <p className="text-[10px] font-bold text-zinc-500">{session?.user?.email}</p>
             </div>
          </div>
          <div className="flex gap-3">
             <div className="flex-1 rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Joined</p>
                <p className="text-xs font-bold text-white mt-1">{session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "Tidak Diketahui"}</p>
             </div>
             <div className="flex-1 rounded-2xl bg-sakura/10 border border-sakura/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-sakura">Loyalty</p>
                <p className="text-xs font-black text-white uppercase mt-1 flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-sakura"/> {stats.loyaltyLevel}</p>
             </div>
          </div>
        </motion.div>

        {/* QUICK TRACKING */}
        <motion.div variants={item} className="lg:col-span-2 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl p-8 shadow-xl flex flex-col justify-center relative overflow-hidden">
          <Search className="absolute right-[-5%] top-[-10%] h-48 w-48 text-sakura opacity-[0.03] pointer-events-none" />
          <div className="relative z-10">
            <h3 className="mb-2 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
              <Search className="h-5 w-5 text-sakura" /> Lacak Pesanan Langsung
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-medium">Lacak status pesanan Anda dengan cepat tanpa perlu masuk ke riwayat transaksi.</p>
            <div className="relative flex items-center max-w-xl">
                <input 
                  type="text" 
                  placeholder="Masukkan Nomor Invoice (INV-...)"
                  value={trackInvoice}
                  onChange={(e) => setTrackInvoice(e.target.value)}
                  className="w-full rounded-2xl border border-white/5 bg-black/40 py-4 pl-5 pr-28 text-sm font-bold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-sakura focus:ring-1 focus:ring-sakura"
                />
                <Link href={trackInvoice ? `/invoice/${trackInvoice}` : '#'} className="absolute right-2 rounded-xl bg-sakura px-6 py-2.5 text-xs font-black text-black transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(253,176,192,0.3)]">
                  CARI
                </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════ SECOND ROW (Stats Grid) ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: "Saldo SassyGurl", value: formatIDR(stats.balance), icon: Wallet, color: "text-white", bg: "bg-white/5 hover:bg-white/10", border: "border-white/10" },
           { label: "Total Points", value: `${stats.points.toLocaleString("id-ID")} XP`, icon: TrendingUp, color: "text-brand-cyan", bg: "bg-brand-cyan/5 hover:bg-brand-cyan/10", border: "border-brand-cyan/20" },
           { label: "Total Transaksi", value: `${stats.totalOrders} Trx`, icon: Box, color: "text-status-success", bg: "bg-status-success/5 hover:bg-status-success/10", border: "border-status-success/20" },
           { label: "Status Akun", value: "Verified", icon: ShieldCheck, color: "text-status-warning", bg: "bg-status-warning/5 hover:bg-status-warning/10", border: "border-status-warning/20" },
         ].map((stat, i) => (
           <motion.div key={i} variants={item} whileHover={{ y: -4 }} className={`relative overflow-hidden rounded-3xl border ${stat.border} ${stat.bg} p-6 flex flex-col justify-between transition-colors shadow-lg`}>
              <stat.icon className={`h-6 w-6 mb-6 ${stat.color}`} />
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">{stat.label}</p>
                 <h3 className={`text-xl lg:text-2xl font-black tracking-tight ${stat.color}`}>{stat.value}</h3>
              </div>
              <stat.icon className={`absolute -right-4 -bottom-4 h-24 w-24 opacity-5 ${stat.color} pointer-events-none`} />
           </motion.div>
         ))}
      </div>

      {/* ═══════════════ THIRD ROW (Transactions & Quick Top Up) ═══════════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LAST TRANSACTIONS */}
        <motion.div variants={item} className="lg:col-span-2 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
                <Clock className="h-5 w-5 text-sakura" /> Pesanan Terakhir
              </h3>
              <button onClick={() => setActiveTab("transactions")} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-sakura transition-colors">
                Lihat Semua
              </button>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 p-4 transition-colors hover:bg-white/[0.03]">
                  <div className="flex gap-4 items-center">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                       <Gamepad2 className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{tx.gameName}</p>
                      <p className="text-[10px] font-bold text-zinc-500 mt-0.5">{tx.invoiceId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                     <StatusBadge status={tx.paymentStatus} />
                     <p className="text-[11px] font-bold text-white mt-1">{formatIDR(tx.amount)}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                   <Search className="h-8 w-8 mb-3 text-zinc-600" />
                   <p className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">Belum ada transaksi</p>
                </div>
              )}
            </div>
        </motion.div>

        {/* QUICK TOP-UP */}
        <motion.div variants={item} className="lg:col-span-1 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
              <Zap className="h-4 w-4 text-sakura" /> Quick Top-Up
            </h2>
          </div>

          {featuredGames.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {featuredGames.slice(0, 4).map((game) => (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-3 transition-all hover:bg-white/[0.03] hover:border-sakura/30"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 transition-all group-hover:border-sakura/50">
                    <div
                      className="absolute inset-0 bg-gradient-to-br opacity-80"
                      style={{ background: `linear-gradient(135deg, ${game.accent}60, transparent)` }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center text-sm font-black text-white drop-shadow-md">
                      {game.shortCode}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-tight text-white truncate transition-colors group-hover:text-sakura">
                      {game.name.split(":")[0]}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5 truncate">
                       SassyGurl Official
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-zinc-500">
              <Gamepad2 className="mx-auto h-6 w-6 mb-3 text-zinc-700" />
              <p className="text-[10px] font-black uppercase tracking-widest">Produk kosong</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <motion.div variants={item} className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl shadow-2xl ">
      <div className="space-y-6 border-b border-white/5 bg-white/[0.02] p-6 lg:p-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
            <History className="h-5 w-5 text-sakura" /> Riwayat Transaksi
          </h2>
          <div className="group relative w-full sm:w-80">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-sakura" />
            <input
              type="text"
              placeholder="Cari invoice atau game..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 py-4 pl-12 pr-6 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-700 focus:border-sakura focus:ring-1 focus:ring-sakura"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {["ALL", "SUCCESS", "PENDING", "FAILED"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              disabled={isPending}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                filter === tab
                  ? "bg-sakura/10 text-sakura border border-sakura/20 shadow-[inset_0_1px_0_0_rgba(253,176,192,0.2)]"
                  : "border border-white/5 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {tab === "ALL" ? "Semua" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-0">
        <AnimatePresence mode="wait">
          {transactions.length > 0 ? (
            <motion.div key={filter + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <table className="hidden w-full text-left md:table">
                <thead className="bg-black/20 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                  <tr>
                    <th className="px-6 py-4">Invoice / Tanggal</th>
                    <th className="px-6 py-4">Game & Produk</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Nominal</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="group transition-colors hover:bg-white/[0.03] border-b border-white/[0.02] last:border-0">
                      <td className="px-6 py-5">
                        <div className="font-mono text-xs font-black text-white transition-colors group-hover:text-sakura">{tx.invoiceId}</div>
                        <div className="mt-1 text-[10px] font-bold text-zinc-600">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-black text-zinc-200">{tx.gameName}</div>
                        <div className="mt-1 text-[10px] font-bold text-zinc-500">{tx.productName}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={tx.paymentStatus} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="font-mono text-sm font-black tracking-tighter text-white">{formatIDR(tx.amount)}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Link
                          href={`/invoice/${tx.invoiceId}`}
                          className="inline-flex rounded-xl border border-white/10 bg-zinc-900 p-2 text-zinc-500 transition-all hover:border-sakura hover:text-sakura"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-3 p-4 md:hidden">
                {transactions.map((tx) => (
                  <div key={tx.id} className="space-y-4 rounded-3xl border border-white/5 bg-black/20 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{tx.invoiceId}</div>
                        <div className="mt-1 text-sm font-black text-white">{tx.gameName}</div>
                      </div>
                      <StatusBadge status={tx.paymentStatus} />
                    </div>
                    <div className="flex items-end justify-between border-t border-white/5 pt-4">
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500">{tx.productName}</div>
                        <div className="mt-1 text-lg font-black tracking-tighter text-white">{formatIDR(tx.amount)}</div>
                      </div>
                      <Link href={`/invoice/${tx.invoiceId}`} className="rounded-xl border border-white/10 bg-zinc-800 p-3 text-sakura transition-colors hover:bg-sakura hover:text-black">
                        <ArrowUpRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 py-32 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/20">
                <Search className="h-6 w-6 text-zinc-700" />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-600">
                Belum ada transaksi
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderWallet = () => (
    <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <Wallet className="h-5 w-5 text-sakura" /> Saldo Dompet
        </h3>
        <div className="mb-8 font-mono text-5xl tracking-tighter font-black text-white">{formatIDR(stats.balance)}</div>
        <p className="text-[10px] font-bold leading-relaxed tracking-wider text-zinc-500">
          Gunakan saldo ini untuk checkout super instan 1 detik tanpa memikirkan kode QRIS atau biaya layanan tambahan.
        </p>
      </div>
      
      <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <Zap className="h-5 w-5 text-sakura" /> Isi Saldo <span className="rounded bg-sakura/20 px-2 py-0.5 text-[8px] text-sakura">SEGERA</span>
        </h3>
        <div className="space-y-4">
          <input 
            type="number" 
            placeholder="Nominal (Min. Rp 10.000)"
            disabled
            className="w-full rounded-2xl border border-white/5 bg-black/40 py-4 px-6 text-sm font-bold text-white outline-none opacity-50 cursor-not-allowed"
          />
          <button 
            disabled
            className="w-full rounded-2xl bg-zinc-800 text-zinc-500 py-4 text-xs font-black tracking-widest transition-all cursor-not-allowed"
          >
            DALAM PENGEMBANGAN
          </button>
        </div>
      </div>
    </motion.div>
  );

  const [profileName, setProfileName] = useState(session?.user?.name || "");
  const [profileWa, setProfileWa] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    const { updateProfileAction } = await import("@/app/actions/auth");
    const res = await updateProfileAction(profileName, profileWa);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
    setSettingsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    const { changePasswordAction } = await import("@/app/actions/auth");
    const res = await changePasswordAction(oldPassword, newPassword);
    if (res.success) {
      toast.success(res.message);
      setOldPassword("");
      setNewPassword("");
    } else {
      toast.error(res.message);
    }
    setSettingsLoading(false);
  };

  const renderSettings = () => (
    <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:gap-8">
      <div className="rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <User className="h-5 w-5 text-sakura" /> Informasi Pribadi
        </h3>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nama Lengkap</label>
            <input 
              type="text" 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-bold text-white outline-none transition-all focus:border-sakura focus:bg-black/60"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nomor WhatsApp</label>
            <input 
              type="text" 
              placeholder="0812xxxxxx"
              value={profileWa}
              onChange={(e) => setProfileWa(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-bold text-white outline-none transition-all focus:border-sakura focus:bg-black/60"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address (Readonly)</label>
            <div className="mt-2 w-full rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm font-bold text-zinc-600 cursor-not-allowed">
              {session?.user?.email}
            </div>
          </div>
          <button 
            type="submit"
            disabled={settingsLoading}
            className="w-full rounded-2xl bg-sakura text-black py-4 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(253,176,192,0.3)]"
          >
            {settingsLoading ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <Shield className="h-5 w-5 text-sakura" /> Keamanan Akun
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Password Lama</label>
            <input 
              type="password" 
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-bold text-white outline-none transition-all focus:border-sakura focus:bg-black/60"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Password Baru</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/5 bg-black/40 p-4 text-sm font-bold text-white outline-none transition-all focus:border-sakura focus:bg-black/60"
            />
          </div>
          <button 
            type="submit"
            disabled={settingsLoading}
            className="w-full rounded-2xl border border-status-danger/30 bg-status-danger/10 py-4 text-xs font-black uppercase tracking-widest text-status-danger hover:bg-status-danger hover:text-white transition-colors disabled:opacity-50"
          >
            {settingsLoading ? "Memproses..." : "Ubah Password"}
          </button>
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
             <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
               <span className="text-status-warning mr-1">⚠️ Perhatian:</span> Jika Anda mendaftar menggunakan Google, Anda tidak memiliki kata sandi dan tidak perlu mengubahnya di sini.
             </p>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const handleLogout = async () => {
    try {
      await logoutAction();
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error("Error clearing session", e);
    } finally {
      await signOut({ redirect: true, callbackUrl: "/auth/login" });
    }
  };

  return (
    <div className="relative flex min-h-screen bg-zinc-950 text-white overflow-hidden">
      
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl md:flex">
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
          {/* Logo */}
          <Link href="/" className="mb-10 flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sakura to-pink-600 shadow-[0_0_15px_rgba(253,176,192,0.3)]">
              <Crown className="h-5 w-5 text-zinc-950" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">SASSY<span className="text-sakura">GURL</span></span>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Member Area</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="space-y-8">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{group.title}</p>
                <div className="space-y-1">
                  {group.items.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          const url = new URL(window.location.href);
                          url.searchParams.set("tab", tab.id);
                          window.history.pushState({}, "", url.toString());
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-all ${
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
            ))}
          </div>
        </div>

        {/* User Profile Summary Bottom */}
        <div className="mt-auto border-t border-zinc-800 p-6">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800 overflow-hidden">
               <img src={session?.user?.image || "/images/default-avatar.png"} alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{session?.user?.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-status-warning" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-status-warning">{stats.loyaltyLevel}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-status-danger/10 px-4 py-2.5 text-xs font-bold text-status-danger transition hover:bg-status-danger/20 active:scale-95"
          >
            <LogOut className="h-4 w-4" /> Logout Akun
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="relative flex-1 h-screen overflow-y-auto md:ml-64">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-sakura/5 blur-[120px]" />
        
        {/* Mobile Nav Header */}
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-xl sticky top-0 z-40">
           <div className="flex items-center justify-between mb-4">
             <Link href="/" className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-sakura" />
                <span className="font-black text-white">SASSY<span className="text-sakura">GURL</span></span>
             </Link>
             <button onClick={handleLogout} className="p-2 text-status-danger bg-status-danger/10 rounded-lg">
               <LogOut className="h-4 w-4" />
             </button>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {navGroups.flatMap(g => g.items).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", tab.id);
                    window.history.pushState({}, "", url.toString());
                  }}
                  className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === tab.id ? "bg-sakura/10 text-sakura border border-sakura/20" : "bg-zinc-900 border border-white/5 text-zinc-400"
                  }`}
                >
                  {tab.label}
                </button>
             ))}
           </div>
        </div>

        <div className="w-full p-4 pt-6 md:p-8 lg:p-12 xl:p-16 pb-20">
          {/* Header Area in Main Content */}
          <motion.div variants={item} initial="hidden" animate="show" className="mb-10 hidden md:flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl capitalize flex items-center gap-3">
                {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || "Dashboard"}
                <Star className="h-6 w-6 text-sakura fill-sakura/20" />
              </h1>
              <p className="text-sm text-zinc-500 font-medium mt-2">Selamat datang di Member Area eksklusif.</p>
            </div>
            <Link href="/" className="flex items-center gap-2 rounded-2xl bg-zinc-900 border border-white/10 px-6 py-3 text-xs font-black uppercase text-white hover:border-sakura/50 transition-all">
              Beli Produk <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <AnimatePresence mode="wait">
             <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
             >
                {activeTab === "overview" && renderOverview()}
                {activeTab === "transactions" && renderTransactions()}
                {activeTab === "wallet" && renderWallet()}
                {activeTab === "settings" && renderSettings()}
             </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "PAID"
      ? { color: "bg-status-success/10 text-status-success border-status-success/20", icon: CheckCircle2, label: "SUCCESS" }
      : status === "PROCESSING"
        ? { color: "bg-status-info/10 text-status-info border-status-info/20", icon: Clock, label: "PROCESSING" }
        : status === "PENDING"
          ? { color: "bg-status-warning/10 text-status-warning border-status-warning/20", icon: Clock, label: "PENDING" }
          : { color: "bg-status-danger/10 text-status-danger border-status-danger/20", icon: XCircle, label: "FAILED" };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${config.color}`}
    >
      {(status === "PROCESSING" || status === "PENDING") ? (
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <config.icon className="h-3 w-3" />
        </motion.span>
      ) : (
        <config.icon className="h-3 w-3" />
      )}
      {config.label}
    </motion.span>
  );
}
