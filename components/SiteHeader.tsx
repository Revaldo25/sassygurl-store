"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ShieldCheck, Menu, X, User, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SassyLogo from "@/components/SassyLogo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/game/mlbb", label: "MLBB" },
  { href: "/game/genshin", label: "Genshin" },
  { href: "/game/hsr", label: "HSR" },
  { href: "/game/zzz", label: "ZZZ" },
  { href: "/game/ff", label: "Free Fire" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <SassyLogo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-xs font-semibold tracking-[0.15em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/cek-pesanan"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
              Cek Pesanan
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-full bg-sakura px-4 py-2 text-xs font-black tracking-[0.18em] text-zinc-950 shadow-[0_0_25px_rgba(253,176,192,0.25)]"
            >
              <ShieldCheck className="h-4 w-4" />
              Masuk
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[68px] z-40 border-b border-white/10 bg-zinc-950/95 p-4 backdrop-blur-3xl lg:hidden"
          >
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  <Gamepad2 className="h-4 w-4 text-sakura" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/cek-pesanan"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-white/80"
              >
                <Search className="h-4 w-4" />
                Cek Pesanan
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-sakura py-3 text-xs font-black text-zinc-950"
              >
                <User className="h-4 w-4" />
                Masuk
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
