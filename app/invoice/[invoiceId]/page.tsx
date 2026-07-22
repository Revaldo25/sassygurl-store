"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Clock, CheckCircle2, Loader2, Receipt, AlertCircle, CreditCard
} from "lucide-react";
import Script from "next/script";
import { trackOrderAction } from "@/app/actions/track";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch via Server Action (auto-uses backend URL + no port hardcode) ──
  const fetchInvoice = useCallback(async () => {
    try {
      const result = await trackOrderAction(params.invoiceId as string);
      if (result.success && result.data) {
        setInvoice(result.data);
        setError(null);
      } else {
        setError(result.message || "Faktur tidak ditemukan.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, [params.invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const pollCount = useRef(0);

  // ── Auto-refresh setiap 5 detik selama status masih pending ──
  useEffect(() => {
    if (!invoice) return;
    const isPending =
      invoice.paymentStatus === "UNPAID" ||
      invoice.paymentStatus === "PENDING" ||
      invoice.orderStatus === "PENDING" ||
      invoice.orderStatus === "PROCESSING";
    if (!isPending) return;

    const interval = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current > 30) {
        clearInterval(interval);
        return;
      }
      fetchInvoice();
    }, 5000);
    return () => clearInterval(interval);
  }, [invoice, fetchInvoice]);

  if (loading && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sakura animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div className="glass-panel p-10 rounded-[2rem] max-w-md w-full border-status-danger/20">
          <AlertCircle className="w-12 h-12 text-status-danger mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">{error || "Invoice Tidak Ditemukan"}</h2>
          <button onClick={() => router.push("/")} className="mt-6 w-full bg-sakura text-black font-black hover:bg-sakura/80 py-3 rounded-2xl transition-colors">KEMBALI KE BERANDA</button>
        </div>
      </div>
    );
  }

  const isSuccess = invoice.paymentStatus === "PAID" || invoice.orderStatus === "SUCCESS";
  const isFailed =
    invoice.paymentStatus === "FAILED" ||
    invoice.paymentStatus === "EXPIRED" ||
    invoice.orderStatus === "ERROR" ||
    invoice.orderStatus === "FAILED";

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel p-10 rounded-[2.5rem] text-center max-w-md w-full border-sakura/20">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sakura/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-sakura" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Payment Success!</h2>
          <p className="text-zinc-500 text-sm font-medium mb-8">
            Pesanan Anda ({invoice.productName}) sedang diproses otomatis oleh sistem Sakura.
          </p>
          <div className="bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-8 text-left space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span>Status Pesanan</span>
              <span className="text-sakura">{invoice.orderStatus}</span>
            </div>
            {invoice.sn && (
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                <span>SN/Voucher</span>
                <span className="text-white">{invoice.sn}</span>
              </div>
            )}
          </div>
          <button onClick={() => router.push("/track")} className="w-full bg-sakura text-black font-black hover:bg-sakura/80 rounded-2xl py-4 text-xs tracking-widest transition-colors">
            KE RIWAYAT PESANAN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-[1000px] mx-auto">
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* KIRI: INSTRUKSI BAYAR */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-sakura" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Detail Bayar</h3>
              </div>
              <span className="px-3 py-1 rounded-lg bg-zinc-950 border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {invoice.invoiceId}
              </span>
            </div>

            <div className="bg-zinc-950/50 rounded-3xl p-8 text-center border border-white/5 relative overflow-hidden">
              {isFailed ? (
                <div className="space-y-4">
                  <AlertCircle className="w-16 h-16 text-status-danger mx-auto" />
                  <p className="text-xl font-black text-white uppercase tracking-widest">PESANAN GAGAL/KADALUARSA</p>
                  <p className="text-zinc-500 text-sm">Silakan buat pesanan baru.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Clock className="w-16 h-16 text-zinc-500 mx-auto animate-pulse" />
                  <p className="text-xl font-black text-white uppercase tracking-widest">MENUNGGU PEMBAYARAN</p>
                  <p className="text-zinc-500 text-sm">
                    Silakan selesaikan pembayaran Anda melalui popup Midtrans atau channel pembayaran yang Anda pilih.
                  </p>
                  {invoice.paymentToken && (
                    <button
                      onClick={() => {
                        // @ts-ignore
                        if (window.snap && !invoice.paymentToken.startsWith("SNAP-")) {
                          // @ts-ignore
                          window.snap.pay(invoice.paymentToken);
                        } else if (invoice.paymentToken.startsWith("http")) {
                          window.location.href = invoice.paymentToken;
                        } else {
                          alert("Sistem pembayaran sedang disiapkan, silakan refresh halaman.");
                        }
                      }}
                      className="mt-6 w-full bg-sakura text-black font-black hover:bg-sakura/80 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,107,152,0.3)] flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      BAYAR SEKARANG
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KANAN: RINGKASAN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2rem] space-y-5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Informasi Pesanan</h3>
            <div className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              <div className="flex justify-between"><span>Game</span><span className="text-white">{invoice.gameName}</span></div>
              <div className="flex justify-between"><span>Produk</span><span className="text-white text-right">{invoice.productName}</span></div>
              <div className="flex justify-between">
                <span>ID Tujuan</span>
                <span className="text-white text-right">{invoice.targetId} {invoice.zoneId ? `(${invoice.zoneId})` : ""}</span>
              </div>
              <div className="flex justify-between"><span>Metode</span><span className="text-white">{invoice.paymentMethod}</span></div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-end">
                <span className="pb-1">Total</span>
                <span className="text-2xl font-black text-sakura tracking-tighter">
                  Rp {invoice.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
