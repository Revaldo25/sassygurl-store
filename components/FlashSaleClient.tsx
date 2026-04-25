"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Flame } from "lucide-react";

export default function FlashSaleClient({ items }: { items: any[] }) {
  // Hitung mundur 5 jam dari sekarang (Bisa disesuaikan dengan database nanti)
  const [timeLeft, setTimeLeft] = useState(5 * 60 * 60); 

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <section className="max-w-[1200px] mx-auto px-6 mb-24 relative z-10">
      <div className="glass-elite rounded-[2.5rem] p-6 md:p-10 border-sakura/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sakura/10 blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sakura text-zinc-950 flex items-center justify-center shadow-[0_0_30px_rgba(253,176,192,0.3)]">
              <Flame className="w-7 h-7 fill-zinc-950" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none mb-1">Flash Deal</h2>
              <p className="text-[10px] text-sakura font-black tracking-[0.2em] uppercase">Diskon Terbatas Bosku!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest hidden sm:block">Berakhir Dalam</span>
            <div className="flex gap-2">
              <div className="bg-zinc-950 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-inner">
                {String(hours).padStart(2, '0')}
              </div>
              <span className="text-zinc-600 font-bold text-xl self-center">:</span>
              <div className="bg-zinc-950 border border-white/10 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-inner">
                {String(minutes).padStart(2, '0')}
              </div>
              <span className="text-zinc-600 font-bold text-xl self-center">:</span>
              <div className="bg-sakura/10 border border-sakura/30 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-sakura shadow-[0_0_15px_rgba(253,176,192,0.2)] animate-pulse">
                {String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {items.map((item) => {
            const percentSold = Math.round((item.sold / item.stock) * 100);
            return (
              <div key={item.id} className="bg-zinc-950/50 p-5 rounded-3xl border border-white/5 hover:border-sakura/40 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-sakura text-zinc-950 text-[10px] font-black px-4 py-2 rounded-bl-2xl z-10">
                  HEMAT {(100 - (item.promoPrice / item.price * 100)).toFixed(0)}%
                </div>
                
                <div className="flex gap-5">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10">
                    <Image src={item.img} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">{item.name}</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{item.item}</p>
                    <div className="mt-3">
                      <p className="text-[10px] text-zinc-600 line-through font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
                      <p className="text-lg font-black text-sakura leading-none mt-0.5">Rp {item.promoPrice.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    <span>Terjual {item.sold}</span>
                    <span className="text-sakura">Sisa {item.stock - item.sold}</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-sakura/50 to-sakura h-full rounded-full transition-all duration-1000" style={{ width: `${percentSold}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}