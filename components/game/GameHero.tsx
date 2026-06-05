import { Zap, ShieldCheck, Clock, Package } from "lucide-react";
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
  publisher,
  icon,
  banner,
  accent,
  currencyName,
  description,
  isHot,
  productCount,
}: Props) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      {/* ═══ Background Hero ═══ */}
      <div className="absolute inset-0 z-0">
        <Image
          src={banner}
          alt={`${name} banner`}
          fill
          sizes="100vw"
          className="object-cover blur-[1px] opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/50 to-[#09090b]" />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top center, ${accent}18, transparent 65%)`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-3 pt-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Game Icon */}
          <Image
            src={icon}
            alt={name}
            width={56}
            height={56}
            className="rounded-[1.2rem] sm:rounded-2xl object-cover border border-white/10 shadow-lg shrink-0 w-12 h-12 sm:w-14 sm:h-14"
          />

          {/* Info */}
          <div className="min-w-0 flex-1">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span
                className="rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-[0.24em] uppercase"
                style={{
                  borderColor: `${accent}40`,
                  backgroundColor: `${accent}12`,
                  color: accent,
                }}
              >
                {currencyName || "Item"}
              </span>
              {isHot && (
                <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 text-[9px] font-bold text-rose-400">
                  🔥 POPULER
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black leading-tight tracking-tight text-white">
              {name}
            </h1>

            {/* Trust chips — compact inline */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-white/40">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" style={{ color: accent }} />
                Proses Instan
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" style={{ color: accent }} />
                Aman & Legal
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" style={{ color: accent }} />
                {productCount} Item
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
