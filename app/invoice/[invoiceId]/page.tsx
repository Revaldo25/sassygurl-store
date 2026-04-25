"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Clock, Copy, CheckCircle2, AlertTriangle, Loader2, 
  ShieldCheck, ExternalLink, ChevronRight, Receipt, Smartphone, CreditCard
} from "lucide-react";
import Image from "next/image";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  
  // State Simulasi (Nanti ditarik dari Prisma via Server Action)
  const [status, setStatus] = useState<"PENDING" | "PAID" | "EXPIRED">("PENDING");
  const [timeLeft, setTimeLeft] = useState(1800); // 30 Menit
  const [copied, setCopied] = useState(false);

  // Mock Data Sesuai Desain Sakura Elite
  const invoice = {
    id: params.invoiceId as string,
    game: "Genshin Impact",
    item: "Blessing of the Welkin Moon",
    total: 79000,
    method: "QRIS",
    vaNumber: "8017123456789012",
    qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SassyGurlStoreElite",
  };

  // Timer Logic
  useEffect(() => {
    if (status !== "PENDING") return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setStatus("EXPIRED"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (status === "PAID") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-elite p-10 rounded-[2.5rem] text-center max-w-md w-full border-sakura/20">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sakura/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-sakura" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Payment Success!</h2>
          <p className="text-zinc-500 text-sm font-medium mb-8">Pesanan sedang diproses otomatis oleh sistem Sakura.</p>
          <button onClick={() => router.push("/dashboard")} className="w-full btn-sakura py-4 text-xs tracking-widest">KE RIWAYAT PESANAN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-[1000px] mx-auto">
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* KIRI: INSTRUKSI BAYAR */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-elite p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-sakura" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Detail Bayar</h3>
              </div>
              <span className="px-3 py-1 rounded-lg bg-zinc-950 border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {invoice.id}
              </span>
            </div>

            <div className="bg-zinc-950/50 rounded-3xl p-8 text-center border border-white/5 relative overflow-hidden">
              {invoice.method === "QRIS" ? (
                <div className="space-y-6">
                  <div className="relative w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    <Image src={invoice.qrUrl} alt="QRIS" fill className="p-2" />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scan QRIS All Payment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Virtual Account Number</p>
                  <div className="text-3xl font-black text-white tracking-tighter">{invoice.vaNumber}</div>
                  <button onClick={() => {navigator.clipboard.writeText(invoice.vaNumber); setCopied(true)}} className="text-[10px] font-black text-sakura uppercase tracking-widest hover:text-white transition-colors">
                    {copied ? "BERHASIL DISALIN!" : "SALIN NOMOR VA"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Panduan Pembayaran:</h4>
              <ul className="text-xs text-zinc-500 space-y-3 font-medium">
                <li className="flex gap-3"><span className="text-sakura">01.</span> Buka aplikasi M-Banking atau E-Wallet Anda.</li>
                <li className="flex gap-3"><span className="text-sakura">02.</span> Scan QR Code di atas atau masukkan No. VA.</li>
                <li className="flex gap-3"><span className="text-sakura">03.</span> Pastikan nominal <span className="text-white">Rp {invoice.total.toLocaleString('id-ID')}</span> sesuai.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* KANAN: TIMER & RINGKASAN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-elite p-8 rounded-[2rem] text-center border-sakura/10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Selesaikan Sebelum</p>
            <div className="text-5xl font-black text-white tracking-tighter mb-4">{formatTime(timeLeft)}</div>
            <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div className="bg-sakura h-full transition-all duration-1000" style={{ width: `${(timeLeft / 1800) * 100}%` }} />
            </div>
          </div>

          <div className="glass-elite p-8 rounded-[2rem] space-y-5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Informasi Pesanan</h3>
            <div className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              <div className="flex justify-between"><span>Game</span><span className="text-white">{invoice.game}</span></div>
              <div className="flex justify-between"><span>Produk</span><span className="text-white text-right">{invoice.item}</span></div>
              <div className="h-px bg-white/5" />
              <div className="flex justify-between items-end">
                <span className="pb-1">Total</span>
                <span className="text-2xl font-black text-sakura tracking-tighter">Rp {invoice.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}