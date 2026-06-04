"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, ShieldCheck, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import SassyLogo from "@/components/SassyLogo";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/#catalog", label: "Games" },
  { href: "/track", label: "Track Order" },
];

export default function SiteHeader() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const role = (session?.user as any)?.role?.toUpperCase() || "GUEST";
  const isAdmin = ["SUPERADMIN", "ADMIN", "FINANCE", "CS", "OWNER"].includes(role);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 border-b border-white/5 backdrop-blur-2xl transition-colors duration-300 ${scrolled ? "bg-zinc-950/90" : "bg-zinc-950/70"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <SassyLogo size="sm" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split('#')[0]) && item.href !== "/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition hover:bg-white/10 hover:text-white ${isActive && item.href === "/" ? "bg-white/10 text-white" : "text-white/70"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="inline-flex items-center gap-2 rounded-full bg-sakura px-5 py-2.5 text-xs font-black tracking-widest uppercase text-zinc-950 shadow-[0_0_20px_rgba(253,176,192,0.2)] hover:scale-105 transition-transform"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isAdmin ? "ADMIN AREA" : "MEMBER AREA"}
                </Link>
                <button
                  onClick={() => signOut()}
                  aria-label="Logout"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-red-500/20 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-full bg-sakura px-5 py-2.5 text-xs font-black tracking-widest uppercase text-zinc-950 shadow-[0_0_20px_rgba(253,176,192,0.2)] hover:scale-105 transition-transform"
              >
                <User className="h-4 w-4" />
                MASUK
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
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
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split('#')[0]) && item.href !== "/";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-black tracking-wider uppercase transition hover:bg-white/10 ${isActive && item.href === "/" ? "border-sakura/20 bg-sakura/10 text-sakura" : "border-white/5 bg-white/5 text-white/80"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {isAuthenticated ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-sakura py-3.5 text-xs font-black uppercase tracking-widest text-zinc-950"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isAdmin ? "ADMIN" : "MEMBER"}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 text-xs font-bold uppercase tracking-widest text-red-400"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-sakura py-3.5 text-xs font-black uppercase tracking-widest text-zinc-950"
                >
                  <User className="h-4 w-4" />
                  Masuk ke Akun
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
