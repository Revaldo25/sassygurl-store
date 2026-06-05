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
          {/* Logo Only Header - Navigation moved to Universal Floating Dock */}
          <Link href="/" className="group flex items-center gap-3">
            <SassyLogo size="sm" />
          </Link>
        </div>
      </header>

    </>
  );
}
