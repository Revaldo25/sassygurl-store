import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import { Home, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halaman Tidak Ditemukan",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-32">
        <div className="relative flex flex-col items-center">
          {/* Sakura glow */}
          <div className="absolute -top-24 h-48 w-48 rounded-full bg-sakura/10 blur-[80px]" />

          {/* Card */}
          <div className="relative rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-2xl p-8 text-center max-w-md w-full">
            {/* 404 large text */}
            <p className="text-7xl font-black text-white/10 select-none">
              404
            </p>

            {/* Title */}
            <h1 className="mt-4 text-2xl font-black">
              Halaman Tidak Ditemukan
            </h1>

            {/* Description */}
            <p className="mt-3 text-sm text-white/50">
              Halaman yang kamu cari tidak ada atau sudah dipindahkan.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-sakura px-5 py-3 text-sm font-black text-zinc-950 transition-opacity hover:opacity-90"
              >
                <Home className="h-4 w-4" />
                Beranda
              </Link>

              <Link
                href="/#catalog"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-white/10"
              >
                <Search className="h-4 w-4" />
                Cari Game
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
