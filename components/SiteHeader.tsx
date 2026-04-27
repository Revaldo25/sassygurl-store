"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShieldCheck, Menu } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/mlbb", label: "MLBB Elite" },
  { href: "/track", label: "Track Order" },
  { href: "/admin", label: "Admin" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_30px_rgba(253,176,192,0.18)]">
            <Image src="/images/ui/logo-sassygurl.png" alt="SassyGurl" fill className="object-contain p-2" />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] tracking-[0.32em] text-sakura/80">SASSYGURL STORE</p>
            <p className="text-sm font-semibold text-white/90">Elite Game Top-Up</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-xs font-semibold tracking-[0.2em] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
            <Search className="h-4 w-4" />
            Search
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-sakura px-4 py-2 text-xs font-black tracking-[0.18em] text-zinc-950 shadow-[0_0_25px_rgba(253,176,192,0.25)]">
            <ShieldCheck className="h-4 w-4" />
            Secure
          </button>
        </div>

        <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
