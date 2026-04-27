"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Volume2 } from "lucide-react";
import { PaymentMethod, Product, formatIDR, getBestProvider } from "@/lib/catalog";
import { playUiSound } from "@/lib/sfx";

type Props = {
  product?: Product | null;
  payment?: PaymentMethod | null;
  accountName?: string | null;
  onCheckout?: () => void;
};

export default function FloatingCheckoutBar({ product, payment, accountName, onCheckout }: Props) {
  const provider = product ? getBestProvider(product) : null;
  const base = product ? provider?.price ?? product.basePrice : 0;
  const total = base + (payment?.feeFlat ?? 0) + Math.round(base * ((payment?.feePercent ?? 0) / 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/80 px-4 py-3 backdrop-blur-3xl"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Checkout</p>
              <p className="mt-1 text-sm font-bold text-white">
                {product ? product.name : "Pilih produk"} {accountName ? `• ${accountName}` : ""}
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:flex">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Smart Route</p>
                <p className="text-sm font-bold text-white">{provider ? provider.name : "Menunggu produk"}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:flex">
              <Volume2 className="h-4 w-4 text-sakura" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Audio</p>
                <p className="text-sm font-bold text-white">Tap checkout untuk bunyi</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Total</p>
              <p className="text-2xl font-black text-white">{formatIDR(total)}</p>
            </div>
            <button
              onClick={() => {
                playUiSound("/media/sfx-click.wav");
                onCheckout?.();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-sakura px-5 py-3 text-sm font-black tracking-[0.16em] text-zinc-950 shadow-[0_0_28px_rgba(253,176,192,0.28)] transition hover:scale-[1.02]"
            >
              Bayar Sekarang
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
