"use client";
import Link from "next/link";
import { Gamepad2, Search, User, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5" />
      
      <div className="relative max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-sakura/50 transition-colors shadow-lg">
            <Gamepad2 className="w-5 h-5 text-sakura" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">
            SGY<span className="text-sakura">STORE</span>
          </span>
        </Link>

        {/* Menu Desktop */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 px-2 py-1.5 rounded-full border border-white/5">
          {['Beranda', 'Katalog Game', 'Flash Sale', 'Cek Invoice'].map((item) => (
            <Link key={item} href="#" className="px-5 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all tracking-widest uppercase">
              {item}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-sakura transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <Link href="#" className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
            <User className="w-4 h-4" />
            <span className="tracking-widest uppercase">Masuk</span>
          </Link>
          <button className="md:hidden text-zinc-400">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}