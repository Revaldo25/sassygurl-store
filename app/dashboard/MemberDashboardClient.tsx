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
  CreditCard
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
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
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
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const renderOverview = () => (
    <>
      {/* ═══════════════ TOP WIDGETS ROW ═══════════════ */}
      <div className="mb-12 grid gap-6 lg:grid-cols-3">
        
        {/* PROFILE CARD - GLASSMORPHISM */}
        <motion.div variants={item} className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-8 shadow-sm transition-all hover:border-sakura/20">
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-6 h-28 w-28 p-1 rounded-full bg-gradient-to-tr from-sakura via-white/20 to-transparent ">
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-900">
                  <img src={session?.user?.image || "/images/default-avatar.png"} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-2 border-zinc-950 bg-emerald-500 shadow-lg" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter">{session?.user?.name || "Sultan"}</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1">{session?.user?.email}</p>
              
              <div className="mt-8 flex w-full gap-2">
                <div className="flex-1 rounded-2xl bg-white/[0.03] border border-white/10 p-3">
                  <p className="text-xs font-black uppercase text-zinc-600 mb-1">Joined</p>
                  <p className="text-xs font-black text-white">{session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "Tidak Diketahui"}</p>
                </div>
                <div className="flex-1 rounded-2xl bg-sakura/10 border border-sakura/20 p-3">
                  <p className="text-xs font-black uppercase text-sakura mb-1">Status</p>
                  <p className="text-xs font-black text-white uppercase tracking-tighter">Verified</p>
                </div>
              </div>
            </div>
        </motion.div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:col-span-2">
          {[
            { label: "Saldo SassyGurl", value: formatIDR(stats.balance), icon: Wallet, color: "text-sakura" },
            { label: "Total Points", value: `${stats.points.toLocaleString("id-ID")} XP`, icon: TrendingUp, color: "text-brand-cyan" },
            { label: "Total Transaksi", value: `${stats.totalOrders} Transaksi`, icon: Box, color: "text-emerald-400" },
            { label: "Loyalty Level", value: stats.loyaltyLevel, icon: Crown, color: "text-amber-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-4 md:p-6 transition-all flex flex-col justify-between min-h-[100px]`}
            >
              <div className={`absolute right-[-10%] top-[-10%] p-4 opacity-10 transition-opacity group-hover:opacity-20 ${stat.color}`}>
                <stat.icon size={60} className="md:w-20 md:h-20" />
              </div>
              <p className="mb-2 text-[8px] md:text-xs font-black uppercase tracking-wider text-zinc-500">{stat.label}</p>
              <h3 className="text-sm md:text-2xl font-black tracking-tight text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════ SECOND WIDGETS ROW ═══════════════ */}
      <div className="mb-12 grid gap-6 lg:grid-cols-2">
        {/* QUICK TRACKING */}
        <motion.div variants={item} className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl">
          <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
            <Search className="h-5 w-5 text-sakura" /> Lacak Pesanan (Quick Tracking)
          </h3>
          <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Masukkan Nomor Invoice (Contoh: INV-12345)"
                value={trackInvoice}
                onChange={(e) => setTrackInvoice(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/50 py-4 pl-6 pr-32 text-sm font-bold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-sakura focus:ring-4 focus:ring-sakura/10"
              />
              <Link href={trackInvoice ? `/invoice/${trackInvoice}` : '#'} className="absolute right-2 rounded-xl bg-sakura px-6 py-2.5 text-xs font-black text-black transition-transform hover:scale-105 active:scale-95">
                LACAK
              </Link>
          </div>
        </motion.div>

        {/* LAST 3 TRANSACTIONS */}
        <motion.div variants={item} className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
                <Clock className="h-5 w-5 text-sakura" /> Pesanan Terakhir
              </h3>
              <button onClick={() => setActiveTab("transactions")} className="text-xs font-bold uppercase tracking-widest text-sakura hover:underline">
                Lihat Semua
              </button>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
                  <div>
                    <p className="text-xs font-black text-white">{tx.gameName}</p>
                    <p className="text-xs text-zinc-500">{tx.invoiceId}</p>
                  </div>
                  <StatusBadge status={tx.paymentStatus} />
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-xs text-zinc-500 py-4">Belum ada transaksi terbaru.</p>
              )}
            </div>
        </motion.div>
      </div>

      {/* QUICK TOP-UP */}
      <motion.div variants={item} className="mb-12 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-white">
            <Gamepad2 className="text-sakura" /> Quick Top-Up
          </h2>
          <Link href="/" className="text-xs font-black uppercase tracking-widest text-zinc-500 transition-colors hover:text-white">
            Lihat Semua
          </Link>
        </div>

        {featuredGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredGames.slice(0, 4).map((game) => (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                className="group flex cursor-pointer flex-col items-center gap-4 rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 text-center transition-all hover:bg-zinc-800/50"
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
        ) : (
          <div className="w-full rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 p-12 text-center text-zinc-500">
            <Gamepad2 className="mx-auto h-8 w-8 mb-4 text-zinc-700" />
            <p className="text-xs font-black uppercase tracking-widest">Produk sedang tidak tersedia</p>
          </div>
        )}
      </motion.div>
    </>
  );

  const renderTransactions = () => (
    <motion.div variants={item} className="overflow-hidden rounded-[3rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md shadow-2xl ">
      <div className="space-y-8 border-b border-white/10 bg-white/[0.02] p-8 sm:p-10">
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
              className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 py-4 pl-12 pr-6 text-xs font-bold text-white outline-none transition-all placeholder:text-zinc-700 focus:border-sakura focus:ring-4 focus:ring-sakura/5"
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {["ALL", "SUCCESS", "PENDING", "FAILED"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleFilterChange(tab)}
              disabled={isPending}
              className={`whitespace-nowrap rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                filter === tab
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "border border-white/10 bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {tab === "ALL" ? "Semua" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <AnimatePresence mode="wait">
          {transactions.length > 0 ? (
            <motion.div key={filter + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <table className="hidden w-full text-left md:table">
                <thead className="text-xs font-black uppercase tracking-wider text-zinc-600">
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
                        <div className="mt-1 text-xs font-bold uppercase tracking-tighter text-zinc-600">
                          {new Date(tx.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs font-black uppercase tracking-tight text-zinc-200">{tx.gameName}</div>
                        <div className="mt-1 text-xs font-bold italic text-zinc-500">{tx.productName}</div>
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
                          className="rounded-xl border border-white/10 bg-zinc-900 p-3 text-zinc-500 transition-all hover:border-sakura hover:text-white"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-4 p-4 md:hidden">
                {transactions.map((tx) => (
                  <div key={tx.id} className="space-y-5 rounded-3xl border border-white/10 bg-zinc-900 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-zinc-500">{tx.invoiceId}</div>
                        <div className="mt-1 text-sm font-black uppercase text-white">{tx.gameName}</div>
                      </div>
                      <StatusBadge status={tx.paymentStatus} />
                    </div>
                    <div className="flex items-end justify-between border-t border-white/10 pt-4">
                      <div>
                        <div className="text-xs font-bold uppercase text-zinc-500">{tx.productName}</div>
                        <div className="mt-1 text-lg font-black tracking-tighter text-white">{formatIDR(tx.amount)}</div>
                      </div>
                      <Link href={`/invoice/${tx.invoiceId}`} className="rounded-xl border border-white/10 bg-zinc-800 p-3 text-sakura">
                        <ArrowUpRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-zinc-900">
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
      <div className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <Wallet className="h-5 w-5 text-sakura" /> Saldo Dompet
        </h3>
        <div className="mb-8 text-5xl font-black text-white">{formatIDR(stats.balance)}</div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Saldo ini dapat digunakan untuk transaksi otomatis tanpa biaya admin!
        </p>
      </div>
      
      <div className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <Zap className="h-5 w-5 text-sakura" /> Top Up Saldo
        </h3>
        <div className="space-y-4">
          <input 
            type="number" 
            placeholder="Nominal (Min. Rp 10.000)"
            className="w-full rounded-2xl border border-white/10 bg-black/50 py-4 px-6 text-sm font-bold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-sakura focus:ring-4 focus:ring-sakura/10"
          />
          <button onClick={() => toast.error("Fitur ini sedang dalam pengembangan.")} className="w-full rounded-2xl bg-sakura py-4 text-xs font-black tracking-widest text-black transition-all hover:bg-sakura/80 hover:scale-[1.02] active:scale-95">
            LANJUT PEMBAYARAN
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div variants={item} className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <User className="h-5 w-5 text-sakura" /> Informasi Pribadi
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nama Lengkap</label>
            <div className="mt-2 text-sm font-bold text-white">{session?.user?.name || "Member VIP"}</div>
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Email Address</label>
            <div className="mt-2 text-sm font-bold text-white">{session?.user?.email}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-md p-8 shadow-xl">
        <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-wider text-white">
          <Shield className="h-5 w-5 text-sakura" /> Keamanan Akun
        </h3>
        <button onClick={() => toast.error("Fitur Ubah Password akan segera hadir.")} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10">
          Ubah Password
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-20 pt-8 sm:px-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-[1100px]"
      >
        {/* ═══════════════ HEADER ═══════════════ */}
        <motion.div variants={item} className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
                <Crown className="h-8 w-8 text-sakura" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-sakura">
                  {stats.loyaltyLevel}
                </span>
              </div>
              <h1 className="flex items-center gap-3 text-4xl font-black uppercase tracking-tighter text-white">
                Dashboard
                <Star className="h-6 w-6 fill-sakura/20 text-sakura" />
              </h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                Member Panel
              </p>
            </div>
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <button className="group flex flex-1 justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-4 text-zinc-400 backdrop-blur-xl transition-all hover:border-sakura/30 hover:text-sakura md:flex-none">
              <Bell className="h-5 w-5 group-hover:animate-bounce" />
            </button>
            <button 
              onClick={async () => {
                try {
                  await logoutAction();
                  localStorage.clear();
                  sessionStorage.clear();
                } catch (e) {
                  console.error("Error clearing C# session", e);
                } finally {
                  await signOut({ redirect: true, callbackUrl: "/auth/login" });
                }
              }}
              className="flex flex-1 justify-center rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-red-400 backdrop-blur-xl transition-all hover:bg-red-500/10 hover:text-red-300 md:flex-none"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* ═══════════════ TABS NAVIGATION ═══════════════ */}
        <motion.div variants={item} className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "overview", label: "Overview", icon: Crown },
            { id: "transactions", label: "Riwayat Transaksi", icon: History },
            { id: "wallet", label: "Dompet Sassy", icon: Wallet },
            { id: "settings", label: "Pengaturan", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                const url = new URL(window.location.href);
                url.searchParams.set("tab", tab.id);
                window.history.pushState({}, "", url.toString());
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-sakura text-black shadow-lg shadow-sakura/20 scale-105"
                  : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ═══════════════ TAB CONTENT ═══════════════ */}
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

      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "PAID"
      ? { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2, label: "SUCCESS", glow: "" }
      : status === "PROCESSING"
        ? { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Clock, label: "PROCESSING", glow: "" }
        : status === "PENDING"
          ? { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock, label: "PENDING", glow: "" }
          : { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle, label: "FAILED", glow: "" };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[9px] font-black ${config.color} ${config.glow}`}
    >
      {(status === "PROCESSING" || status === "PENDING") ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <config.icon className="h-3 w-3" />
        </motion.span>
      ) : (
        <config.icon className="h-3 w-3" />
      )}
      {config.label}
    </motion.span>
  );
}
