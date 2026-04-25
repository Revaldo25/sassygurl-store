import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-sakura-glow pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 mb-10 rounded-full bg-sakura-dim border border-sakura/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sakura opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sakura"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sakura">
            Elite Gaming Experience
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1]">
          SGY<span className="text-sakura">STORE</span> <br />
          <span className="text-sakura-gradient">PRECISION TOP-UP</span>
        </h1>

        <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto mb-12 font-medium tracking-wide leading-relaxed">
          Destinasi utama para Sultan. Transaksi instan secepat kilat dengan standar keamanan perbankan dan layanan VIP 24 jam penuh.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="#games" className="btn-sakura text-xs tracking-widest px-8 py-4 flex items-center gap-2">
            MULAILAH TRANSAKSI <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#games" className="text-xs font-black tracking-widest text-zinc-400 hover:text-sakura transition-colors uppercase">
            Cek Katalog Harga
          </Link>
        </div>
      </div>
    </section>
  );
}