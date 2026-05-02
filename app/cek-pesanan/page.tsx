"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { trackOrderAction } from "@/app/actions/track";

export default function CekPesanan() {
  const [invoice, setInvoice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCek = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await trackOrderAction(invoice);
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.message || "Invoice tidak ditemukan.");
      }
    } catch (err) {
      setError("Gagal menghubungi server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString)) + ' WIB';
  };

  const getStatusConfig = (status: string) => {
    if (status === 'SUCCESS') return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 };
    if (status === 'FAILED') return { color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle };
    return { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock };
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <SiteHeader />
      
      {/* Background Decor */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-brand-cyan/5 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-sakura/10 p-3 text-sakura">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Lacak Pesanan</h1>
          <p className="mt-3 text-sm text-zinc-400">Masukkan nomor invoice Anda untuk melihat status top-up secara real-time.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <form onSubmit={handleCek} className="relative mb-8 rounded-[2rem] border border-white/10 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-2xl transition focus-within:border-sakura/50">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full pl-4 flex items-center">
                <Search className="h-5 w-5 text-zinc-500 absolute" />
                <input 
                  type="text" 
                  placeholder="Contoh: SGY-123456" 
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  className="w-full bg-transparent py-4 pl-8 pr-4 text-sm font-bold text-white outline-none placeholder:text-zinc-600 uppercase tracking-widest"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-sakura px-8 py-4 text-xs font-black text-zinc-950 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isLoading ? "MENCARI..." : "LACAK SEKARANG"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-bold text-red-400">
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[2rem] border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-3xl md:p-8">
                <div className="mb-6 flex flex-col items-center justify-between gap-4 border-b border-white/5 pb-6 sm:flex-row">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Invoice ID</p>
                    <p className="mt-1 font-mono text-lg font-black text-white">{result.invoiceId}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${getStatusConfig(result.orderStatus).color}`}>
                    {getStatusConfig(result.orderStatus).icon({ className: "h-4 w-4" })}
                    {result.orderStatus}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Waktu Pembelian</p>
                    <p className="mt-1 text-sm font-bold text-white">{formatDate(result.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Game & Produk</p>
                    <p className="mt-1 text-sm font-bold text-white">{result.gameName}</p>
                    <p className="text-[11px] text-zinc-400">{result.productName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target ID</p>
                    <p className="mt-1 font-mono text-sm font-bold text-white">{result.targetId} {result.targetZone ? `(${result.targetZone})` : ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Metode Pembayaran</p>
                    <p className="mt-1 text-sm font-bold text-white">{result.paymentMethod.toUpperCase()}</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl border border-sakura/20 bg-sakura/5 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-sakura" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Total Bayar</span>
                  </div>
                  <p className="text-2xl font-black text-sakura">
                    Rp {result.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}