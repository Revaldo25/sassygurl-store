import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import { Gamepad2, Home } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Tidak Ditemukan",
};

export default function GameNotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-32">
        <div className="relative flex flex-col items-center">
          {/* Sakura glow */}
          <div className="absolute -top-24 h-48 w-48 rounded-full bg-sakura/10 blur-[80px]" />

          {/* Card */}
          <div className="relative rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-2xl p-8 text-center max-w-md w-full">
            {/* Gamepad icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Gamepad2 className="h-8 w-8 text-sakura" />
            </div>

            {/* Title */}
            <h1 className="mt-6 text-2xl font-black">
              Game Tidak Ditemukan
            </h1>

            {/* Description */}
            <p className="mt-3 text-sm text-white/50">
              Game yang kamu cari belum tersedia di SassyGurl Store atau alamat
              URL salah.
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
                <Gamepad2 className="h-4 w-4" />
                Lihat Semua Game
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
