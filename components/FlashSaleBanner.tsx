"use client";

import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";

export default function FlashSaleBanner({ flashSaleData }: { flashSaleData: any }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!flashSaleData?.endTimeUtc) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(flashSaleData.endTimeUtc + "Z").getTime();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null); // Ended
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [flashSaleData]);

  if (!timeLeft) return null;

  return (
    <div className="relative z-20 mx-auto max-w-6xl px-4 pt-4 md:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-status-warning/30 bg-gradient-to-r from-obsidian via-[#2a1a00] to-obsidian p-6 shadow-[0_0_40px_rgba(255,165,0,0.15)] animate-in fade-in slide-in-from-bottom-4">
        {/* Animated background flames/glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-status-warning to-transparent opacity-50" />
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-status-warning/20 blur-[50px] animate-pulse" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-status-warning/20 blur-[50px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-status-warning/20 border border-status-warning/40 shadow-[0_0_15px_rgba(255,165,0,0.3)]">
              <Flame className="h-8 w-8 text-status-warning animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider drop-shadow-md flex items-center justify-center md:justify-start gap-2">
                Flash Sale <span className="bg-status-warning text-black px-2 py-0.5 rounded text-sm md:text-lg">-{flashSaleData.discountPercent}%</span>
              </h2>
              <p className="text-sm font-bold text-status-warning/80 mt-1">Diskon spesial untuk game terpilih. Waktu terbatas!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="text-status-warning h-6 w-6" />
            <div className="flex gap-2 text-2xl font-black text-white">
              <div className="bg-black/60 border border-status-warning/30 rounded-lg w-12 h-14 flex items-center justify-center shadow-inner">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <span className="text-status-warning flex items-center animate-pulse">:</span>
              <div className="bg-black/60 border border-status-warning/30 rounded-lg w-12 h-14 flex items-center justify-center shadow-inner">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <span className="text-status-warning flex items-center animate-pulse">:</span>
              <div className="bg-black/60 border border-status-warning/30 rounded-lg w-12 h-14 flex items-center justify-center shadow-inner text-status-warning">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
