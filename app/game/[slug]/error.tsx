"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("GamePage Error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-red-500/10 bg-zinc-900/40 p-8 text-center backdrop-blur-3xl shadow-2xl">
          {/* Neon Top Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-red-500/10 blur-[80px]" />

          {/* Warning Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 mb-6">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2">Terjadi Kesalahan!</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            {error.message || "Gagal memuat halaman game. Pastikan koneksi internet Anda aktif dan database backend menyala."}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-4 text-sm font-black transition"
            >
              <RotateCcw className="h-4 w-4" />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-sakura hover:bg-white text-zinc-950 px-5 py-4 text-sm font-black transition"
            >
              <Home className="h-4 w-4" />
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
