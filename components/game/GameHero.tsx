import { Zap, ShieldCheck, Package, Star, ShoppingCart } from "lucide-react";
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
  totalSold: number;
  averageRating: number;
  totalReviews: number;
};

export default function GameHero({
  name,
  icon,
  banner,
  accent,
  currencyName,
  isHot,
  productCount,
  totalSold,
  averageRating,
  totalReviews,
}: Props) {
  // Use SassyGurl Sakura pink as fallback if accent is missing or too generic
  const glowColor = accent || "#FDB0C0";

  return (
    <section className="relative bg-obsidian flex items-end pt-32 pb-8 md:pb-12 min-h-[300px] md:min-h-[380px] overflow-hidden group">
      {/* ═══ Immersive Background Banner ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-transform duration-[10s] ease-out group-hover:scale-110">
        <Image
          src={banner}
          alt={`${name} banner`}
          fill
          sizes="100vw"
          className="object-cover opacity-30 object-top blur-[2px] transition-all duration-1000 group-hover:blur-none group-hover:opacity-50"
          priority
        />
        {/* Soft radial glow reflecting the game's accent color */}
        <div 
          className="absolute inset-0 mix-blend-screen opacity-40 transition-opacity duration-1000 group-hover:opacity-70 group-hover:animate-pulse-slow" 
          style={{ background: `radial-gradient(circle at 50% 30%, ${glowColor}90 0%, transparent 70%)` }} 
        />
        {/* Deep gradient overlays for blending into the body */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
        {/* Game Icon (Premium Glass Card) */}
        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-[2rem] overflow-hidden shrink-0 z-10 animate-fade-in-up">
          {/* Glowing backdrop border */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-white/5 opacity-50" />
          <div 
            className="absolute -inset-2 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-700" 
            style={{ backgroundColor: glowColor }}
          />
          <div className="absolute inset-[2px] rounded-[1.8rem] overflow-hidden bg-obsidian-surface">
            <Image
              src={icon}
              alt={name}
              fill
              sizes="(max-width: 768px) 112px, 144px"
              className="object-cover scale-[1.02] group-hover:scale-110 transition-transform duration-700"
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
            
            {/* Live Social Proof Rating */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-bold text-amber-400">{averageRating.toFixed(1)}</span>
              <span className="text-[10px] text-amber-400/70">({(totalReviews / 1000).toFixed(1)}rb Ulasan)</span>
            </div>
          </div>

          {/* Title */}
          <h1 
            className="text-4xl md:text-6xl font-black leading-none tracking-tight text-white mb-4 drop-shadow-2xl transition-all duration-700"
            style={{ textShadow: `0 0 40px ${glowColor}80` }}
          >
            {name}
          </h1>

          {/* Trust chips & Sold count (VIP Style) */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md shadow-lg">
              <ShoppingCart className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-white">{(totalSold / 1000).toFixed(1)}rb</span> Terjual
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Proses Instan
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm hidden sm:flex">
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
