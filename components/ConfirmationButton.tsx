"use client";
import { useState } from "react";

export default function ConfirmationButton({ disabled }: { disabled: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full rounded-2xl bg-white hover:bg-slate-200 text-[var(--bg-dark)] py-5 text-sm font-black tracking-widest uppercase disabled:opacity-30 disabled:hover:bg-white transition-all hover:scale-[1.02] shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:drop-shadow-[0_10px_30px_rgba(216,167,177,0.4)] relative overflow-hidden group"
    >
      <div className="flex items-center justify-center gap-2 relative z-10">
        <span className={`text-xl transition-all ${isHovered ? "text-[var(--rose-main)]" : ""}`}>🔒</span>
        <span className="relative z-10">Konfirmasi Pembayaran</span>
      </div>
      
      {/* Lapisan Shimmer (Efek Gerak) */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></span>
    </button>
  );
}