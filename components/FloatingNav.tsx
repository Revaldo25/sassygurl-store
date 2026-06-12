"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Search, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function FloatingNav() {
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const isAuthenticated = status === "authenticated";
  const role = (session?.user as any)?.role?.toUpperCase() || "GUEST";
  const isAdmin = ["SUPERADMIN", "ADMIN", "FINANCE", "CS", "OWNER"].includes(role);

  // High performance scroll tracking for #catalog
  const [isCatalogInView, setIsCatalogInView] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setIsCatalogInView(false);
      return;
    }

    const catalogElement = document.getElementById("catalog");
    if (!catalogElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsCatalogInView(entries[0].isIntersecting);
      },
      { threshold: 0.2, rootMargin: "-10% 0px -40% 0px" }
    );

    observer.observe(catalogElement);
    return () => observer.disconnect();
  }, [pathname]);

  // Hide floating nav on admin pages
  if (pathname.startsWith("/admin")) return null;

  const navItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/#catalog", label: "Katalog", icon: Gamepad2 },
    { href: "/track", label: "Lacak", icon: Search },
    { 
      href: isAuthenticated ? (isAdmin ? "/admin" : "/dashboard") : "/auth/login", 
      label: isAuthenticated ? "Profil" : "Masuk", 
      icon: User 
    },
  ];

  return (
    <div className="fixed bottom-0 md:bottom-6 left-0 w-full md:left-1/2 md:-translate-x-1/2 z-[100] md:w-auto transition-transform duration-300">
      <nav className="flex items-center justify-around md:justify-center md:gap-2 px-2 py-2 md:px-3 md:py-3 bg-zinc-950/95 md:bg-zinc-900/90 backdrop-blur-xl border-t border-white/10 md:border md:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]">
        {navItems.map((item) => {
          let isActive = false;
          
          if (item.label === "Beranda") {
            isActive = pathname === "/" && !isCatalogInView;
          } else if (item.label === "Katalog") {
            isActive = pathname.startsWith("/games") || (pathname === "/" && isCatalogInView);
          } else {
            isActive = pathname.startsWith(item.href.split('#')[0]);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 md:flex-none md:w-20 py-2 md:rounded-2xl transition-all duration-300 group ${
                isActive ? "text-white" : "text-white/40 hover:text-white/80"
              }`}
            >
              {/* Pure CSS Active Background Glow */}
              <div 
                className={`absolute inset-0 bg-white/5 md:bg-white/10 md:rounded-2xl transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
              />

              <div className="relative z-10 flex flex-col items-center gap-1 md:gap-1.5">
                <Icon className={`w-5 h-5 md:w-5 md:h-5 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(253,176,192,0.5)] text-sakura" : "group-hover:scale-110"}`} />
                <span className={`text-[10px] md:text-[9px] font-bold tracking-wide md:tracking-widest capitalize md:uppercase transition-colors ${isActive ? "text-sakura" : ""}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
