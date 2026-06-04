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

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-end justify-between">
          
          {/* Left Column — Brand & Info */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.28em] uppercase"
                style={{
                  borderColor: `${accent}40`,
                  backgroundColor: `${accent}12`,
                  color: accent,
                }}
              >
                {currencyName || "Item"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white/60">
                PENGIRIMAN OTOMATIS
              </span>
              {isHot && (
                <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-[10px] font-bold text-rose-400">
                  🔥 POPULER
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white flex items-center gap-3">
                <Image
                  src={icon}
                  alt={name}
                  width={56}
                  height={56}
                  className="rounded-2xl object-cover border border-white/10 shadow-lg"
                />
                {name}
              </h1>
              <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-white/50 font-medium">
                {description || `Top up ${name} termurah, teraman, dan terpercaya. Dapatkan nominal item terlengkap dengan harga distributor otomatis.`}
              </p>
            </div>

            {/* Trust indicators — real data only */}
            <div className="flex flex-wrap gap-2 max-w-2xl">
              {[
                { icon: Package, label: "Produk Tersedia", value: `${productCount} Item` },
                { icon: Zap, label: "Proses Otomatis", value: "Instan" },
                { icon: ShieldCheck, label: "Pembayaran", value: "Aman & Legal" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-zinc-900/30 px-3 py-2 backdrop-blur-sm transition duration-300 hover:border-white/10"
                >
                  <stat.icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold leading-none">{stat.label}</p>
                    <p className="text-xs font-black text-white leading-tight mt-0.5">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Trust Badges ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 relative z-20 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "PROSES INSTAN", sub: "Masuk otomatis dalam 1-3 detik." },
            { icon: ShieldCheck, label: "PEMBAYARAN LEBIH AMAN", sub: "Enkripsi SSL & Payment Gateway berlisensi." },
            { icon: Clock, label: "LAYANAN AUTO 24/7", sub: "Sistem aktif tanpa libur, diproses otomatis." },
          ].map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/50 p-4 backdrop-blur-sm shadow-xl hover:border-white/10 transition duration-300"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accent}15` }}
              >
                <b.icon className="w-5 h-5" style={{ color: accent }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-white tracking-wide uppercase">{b.label}</p>
                <p className="text-[10px] text-white/40 font-semibold leading-normal mt-0.5">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
