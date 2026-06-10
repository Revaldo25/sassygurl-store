import { Zap, ShieldCheck, Package } from "lucide-react";
import Image from "next/image";

type Props = {
  name: string;
  publisher?: string;
  icon: string;
  banner: string;
  accent: string;
  currencyName: string;
  description: string;
  isHot: boolean;
  productCount: number;
};

export default function GameHero({
  name,
  icon,
  banner,
  accent,
  currencyName,
  isHot,
  productCount,
}: Props) {
  // Use SassyGurl Sakura pink as fallback if accent is missing or too generic
  const glowColor = accent || "#FDB0C0";

  return (
    <section className="relative bg-obsidian flex items-end pt-24 pb-8 md:pb-12 min-h-[220px] md:min-h-[280px] overflow-hidden">
      {/* ═══ Immersive Background Banner ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src={banner}
          alt={`${name} banner`}
          fill
          sizes="100vw"
          className="object-cover opacity-20 object-top blur-sm scale-105"
          priority
        />
        {/* Soft radial glow reflecting the game's accent color */}
        <div 
          className="absolute inset-0 mix-blend-screen opacity-30" 
          style={{ background: `radial-gradient(circle at 50% 30%, ${glowColor}80 0%, transparent 60%)` }} 
        />
        {/* Deep gradient overlays for blending into the body */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
        {/* Game Icon (Premium Glass Card) */}
        <div className="relative group w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden shrink-0 z-10 animate-fade-in-up">
          {/* Glowing backdrop border */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-white/5 opacity-50" />
          <div 
            className="absolute -inset-2 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" 
            style={{ backgroundColor: glowColor }}
          />
          <div className="absolute inset-[2px] rounded-[1.8rem] overflow-hidden bg-obsidian-surface">
            <Image
              src={icon}
              alt={name}
              fill
              sizes="(max-width: 768px) 96px, 128px"
              className="object-cover scale-[1.02] group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Info Container */}
        <div className="min-w-0 flex-1 pb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {isHot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-[10px] font-black tracking-widest text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                🔥 HOT
              </span>
            )}
            <span
              className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur-md"
              style={{ color: glowColor, borderColor: `${glowColor}40`, boxShadow: `0 0 10px ${glowColor}20` }}
            >
              {currencyName || "Item"}
            </span>
          </div>

          {/* Title */}
          <h1 
            className="text-3xl md:text-5xl font-black leading-none tracking-tight text-white mb-4 drop-shadow-xl"
            style={{ textShadow: `0 0 30px ${glowColor}60` }}
          >
            {name}
          </h1>

          {/* Trust chips (VIP Style) */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] md:text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Proses Instan
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              100% Legal & Aman
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <Package className="h-3.5 w-3.5 text-blue-400" />
              {productCount} Pilihan Produk
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
