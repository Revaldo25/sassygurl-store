"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  History, 
  User, 
  Settings, 
  Gamepad2, 
  TrendingUp, 
  Users, 
  Activity, 
  Package, 
  ChevronRight, 
  LogOut,
  Menu,
  X,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Zap
} from "lucide-react";
import { signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  icon: any;
  roles: string[];
};

const navItems: NavItem[] = [
  // Common
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["MEMBER", "RESELLER", "VIP", "CS", "FINANCE", "SUPERADMIN", "OWNER"] },
  
  // Member
  { label: "My Orders", href: "/dashboard?tab=orders", icon: History, roles: ["MEMBER", "RESELLER", "VIP"] },
  { label: "Loyalty Points", href: "/dashboard?tab=points", icon: Zap, roles: ["MEMBER", "RESELLER", "VIP"] },
  { label: "Profile", href: "/dashboard?tab=profile", icon: User, roles: ["MEMBER", "RESELLER", "VIP"] },
  
  // Admin / Owner
  { label: "Transaction List", href: "/dashboard?tab=transactions", icon: History, roles: ["CS", "FINANCE", "SUPERADMIN", "OWNER"] },
  { label: "Game Manager", href: "/dashboard?tab=games", icon: Gamepad2, roles: ["SUPERADMIN", "OWNER"] },
  { label: "Product Sync", href: "/dashboard?tab=sync", icon: Package, roles: ["SUPERADMIN", "OWNER"] },
  
  // Financial (Owner)
  { label: "Financial Analytics", href: "/dashboard?tab=analytics", icon: TrendingUp, roles: ["FINANCE", "SUPERADMIN", "OWNER"] },
  { label: "Provider Balance", href: "/dashboard?tab=providers", icon: Activity, roles: ["SUPERADMIN", "OWNER"] },
  { label: "User Management", href: "/dashboard?tab=users", icon: Users, roles: ["SUPERADMIN", "OWNER"] },
  
  // Support
  { label: "Support Tickets", href: "/dashboard?tab=support", icon: MessageSquare, roles: ["MEMBER", "CS", "SUPERADMIN", "OWNER"] },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsOpen(false);
      else setIsOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredItems = navItems.filter(item => item.roles.includes(role.toUpperCase()));

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-sakura text-zinc-950 shadow-2xl lg:hidden"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 80 }}
        className={`fixed left-0 top-0 z-50 h-full border-r border-white/5 bg-zinc-950 transition-all duration-300 ${isOpen ? "p-6" : "p-4"} overflow-hidden hidden lg:flex flex-col`}
      >
        {/* Logo Section */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sakura to-rose-500 shadow-lg shadow-sakura/20">
            <ShieldCheck className="h-6 w-6 text-zinc-950" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="whitespace-nowrap"
              >
                <h2 className="text-sm font-black tracking-tighter text-white">SASSYGURL <span className="text-sakura">ULTRA</span></h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {filteredItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-all duration-200 ${
                    active 
                      ? "bg-sakura/10 text-sakura border border-sakura/10" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-sakura" : ""}`} />
                  <AnimatePresence>
                    {isOpen && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-black tracking-tight whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {active && isOpen && (
                    <motion.div layoutId="activeDot" className="ml-auto h-1 w-1 rounded-full bg-sakura" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-2 pt-10">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-4 rounded-2xl px-3 py-3.5 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isOpen && <span className="text-xs font-black tracking-tight">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed left-0 top-0 z-[55] h-full w-[80%] border-r border-white/5 bg-zinc-950 p-6 shadow-2xl lg:hidden"
          >
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sakura text-zinc-950">
                <ShieldCheck />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">SASSYGURL ULTRA</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">{role}</p>
              </div>
            </div>
            <nav className="space-y-2">
              {filteredItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <div className={`flex items-center gap-4 rounded-2xl px-4 py-4 ${pathname === item.href ? "bg-sakura text-zinc-950" : "text-zinc-500 hover:text-white"}`}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-black tracking-tight">{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-10 flex w-full items-center gap-4 px-4 py-4 text-red-500"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-black">Logout</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {isOpen && isMobile && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
