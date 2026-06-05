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
  return (
    <section className="relative border-b border-white/5 bg-[#09090b] h-[120px] md:h-[160px] flex items-end pb-4 md:pb-6">
      {/* ═══ Background Banner ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          src={banner}
          alt={`${name} banner`}
          fill
          sizes="100vw"
          className="object-cover opacity-30 object-top"
          priority
        />
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end gap-4 md:gap-5">
        {/* Game Icon */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 shadow-2xl shrink-0 bg-zinc-900" style={{ borderColor: `${accent}40` }}>
          <Image
            src={icon}
            alt={name}
            fill
            sizes="(max-width: 768px) 64px, 80px"
            className="object-cover"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 pb-1">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
            {isHot && (
              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 leading-none">
                🔥 POPULER
              </span>
            )}
            <span
              className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold leading-none backdrop-blur-sm"
              style={{ color: accent }}
            >
              {currencyName || "Item"}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl md:text-3xl font-black leading-none tracking-tight text-white mb-2 md:mb-3 truncate">
            {name}
          </h1>

          {/* Trust chips */}
          <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs font-semibold text-white/50">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 md:h-3.5 md:w-3.5 text-amber-400" />
              Instan
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-400" />
              Aman
            </span>
            <span className="flex items-center gap-1.5">
              <Package className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-400" />
              {productCount} Produk
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
