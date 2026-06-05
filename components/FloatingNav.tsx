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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto transition-transform duration-300">
      <nav className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 px-3 py-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)]">
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
              className={`relative flex flex-col items-center justify-center w-[72px] sm:w-20 py-2 rounded-2xl transition-all duration-300 group ${
                isActive ? "text-white" : "text-white/40 hover:text-white/80"
              }`}
            >
              {/* Pure CSS Active Background Glow (No Framer Motion = Extreme Performance) */}
              <div 
                className={`absolute inset-0 bg-white/10 rounded-2xl transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
              />

              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(253,176,192,0.5)] text-sakura" : "group-hover:scale-110"}`} />
                <span className={`text-[9px] font-bold tracking-widest uppercase transition-colors ${isActive ? "text-sakura" : ""}`}>
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
