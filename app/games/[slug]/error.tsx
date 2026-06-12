"use client";

import { useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Game Page Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <SiteHeader />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-[2.5rem] border border-white/10 bg-zinc-900/50 backdrop-blur-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-status-danger/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-status-danger/20">
            <AlertTriangle className="w-10 h-10 text-status-danger" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">Terjadi Kesalahan</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Sistem gagal memuat data katalog game dari server. Silakan coba muat ulang halaman atau kembali ke beranda.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="flex-1 py-4 bg-sakura hover:bg-sakura/90 text-zinc-950 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
