import { Zap, ShieldCheck, Clock, Crown, Users, Diamond } from "lucide-react";
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
          className="object-cover scale-105 blur-[2px] opacity-40"
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

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-end">
          
          {/* Left Column — Brand & Stats */}
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                {name}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/50">
                {description || `Top up ${name} termurah, teraman, dan terpercaya. Dapatkan nominal item terlengkap dengan harga distributor otomatis.`}
              </p>
            </div>

            {/* Quick stats badges */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-xl">
              {[
                { icon: Diamond, label: "Item Terjual", value: "99K+" },
                { icon: Users, label: "Aktif Online", value: "8,400+" },
                { icon: Crown, label: "Rating Toko", value: "4.9 ★" },
                { icon: Zap, label: "Rata Waktu", value: "≤ 1 menit" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/5 bg-zinc-900/30 p-3.5 backdrop-blur-xl transition duration-300 hover:border-white/10"
                >
                  <stat.icon className="h-4 w-4" style={{ color: accent }} />
                  <p className="mt-2.5 text-[9px] uppercase tracking-[0.2em] text-white/35 font-bold">{stat.label}</p>
                  <p className="mt-0.5 text-xs font-black text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Large Floating Identity Card */}
          <div className="relative flex justify-center lg:justify-end">
            <div
              className="absolute inset-0 rounded-[2.5rem] blur-3xl opacity-20"
              style={{
                background: `radial-gradient(circle, ${accent}, transparent)`,
              }}
            />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-2xl shadow-2xl flex items-center gap-5 w-full max-w-sm">
              <div className="shrink-0 inline-block p-1 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent">
                <img
                  src={icon}
                  alt={name}
                  className="w-20 h-20 rounded-[1.8rem] object-cover border border-white/10"
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-tight">{name}</h2>
                <p className="text-xs font-bold text-sakura uppercase tracking-widest mt-1">{publisher || "Official Partner"}</p>
                <p className="text-[10px] text-white/40 font-medium mt-2 leading-relaxed">
                  Tersedia {productCount} produk. Masukkan ID, selesaikan pembayaran, item langsung masuk!
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══ Trust Badges ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "PROSES INSTAN", sub: "Masuk otomatis dalam 1-3 detik." },
            { icon: ShieldCheck, label: "PEMBAYARAN LEBIH AMAN", sub: "Enkripsi SSL & Payment Gateway berlisensi." },
            { icon: Clock, label: "LAYANAN AUTO 24/7", sub: "Sistem aktif tanpa libur, diproses otomatis." },
          ].map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/50 p-4.5 backdrop-blur-xl shadow-xl hover:border-white/10 transition duration-300"
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
