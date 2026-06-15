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
      <header className={`sticky top-0 z-50 border-b border-white/5 backdrop-blur-2xl transition-colors duration-300 ${scrolled ? "bg-zinc-950/95 shadow-md" : "bg-zinc-950/80"}`}>
        {/* App-like Header Layout */}
        <div className="mx-auto flex max-w-7xl items-center px-4 py-3 md:px-6 relative h-14">
          
          {/* Left: Hamburger Menu (Mobile Only) */}
          <div className="absolute left-4 md:hidden flex items-center">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/5"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Left / Center: Logo */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-105">
              <SassyLogo size="sm" />
            </Link>
          </div>

          {/* Center: Clean Spacer */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-8">
            {/* Desktop links removed as per user feedback, now centralized in FloatingNav */}
          </div>

          {/* Right: Actions */}
          <div className="absolute right-4 md:relative md:right-0 flex items-center gap-4">
            <div className="hidden md:block">
               {isAuthenticated ? (
                 <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-sakura/10 text-sakura border border-sakura/20 hover:bg-sakura/20 transition-colors text-sm font-bold shadow-[0_0_15px_rgba(253,176,192,0.15)]">
                    <User className="w-4 h-4" />
                    <span>{isAdmin ? "Admin Panel" : "Member Area"}</span>
                 </Link>
               ) : (
                 <div className="flex items-center gap-3">
                   <Link href="/auth/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors px-2">
                     Masuk
                   </Link>
                   <Link href="/auth/register" className="px-5 py-1.5 rounded-full bg-sakura text-obsidian text-sm font-bold hover:bg-sakura/90 transition-colors shadow-[0_0_15px_rgba(253,176,192,0.3)]">
                     Daftar
                   </Link>
                 </div>
               )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-obsidian border-r border-white/10 p-6 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <SassyLogo size="sm" />
                <button onClick={() => setMobileOpen(false)} className="p-2 text-white/50 hover:text-white rounded-full bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-white/80 hover:bg-white/5 hover:text-sakura font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto border-t border-white/10 pt-6">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <Link 
                      href={isAdmin ? "/admin" : "/dashboard"}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sakura/10 text-sakura font-bold border border-sakura/20"
                    >
                      <User className="w-5 h-5" />
                      {isAdmin ? "Admin Panel" : "Member Area"}
                    </Link>
                    <button 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-left px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center w-full py-3 rounded-xl bg-sakura text-obsidian font-bold shadow-[0_0_20px_rgba(253,176,192,0.3)]"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
