"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock3, CheckCircle2, Sparkles, CreditCard } from "lucide-react";
import { PaymentMethod, formatIDR } from "@/lib/catalog";

type Props = {
  methods: PaymentMethod[];
  selectedCode?: string;
  onSelect: (method: PaymentMethod) => void;
  total?: number;
  providerName?: string;
};

export default function PaymentSection({ methods, selectedCode, onSelect, total = 0, providerName }: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-3xl md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">STEP 03</p>
          <h3 className="mt-1 text-xl font-black text-white md:text-2xl">Pilih Pembayaran</h3>
          <p className="mt-2 text-sm text-white/60">
            QRIS instant, e-wallet, VA, hingga retail. Estimasi proses ditampilkan secara jelas agar user merasa aman.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
          <Sparkles className="h-4 w-4" />
          Auto fee calc
        </div>
      </div>

      <div className="grid gap-3">
        {methods.map((method, index) => {
          const selected = selectedCode === method.code;
          return (
            <motion.button
              key={method.code}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              onClick={() => onSelect(method)}
              className={[
                "flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition",
                selected
                  ? "border-sakura/55 bg-sakura/10 shadow-[0_0_28px_rgba(253,176,192,0.14)]"
                  : "border-white/10 bg-zinc-950/[0.55] hover:border-white/20 hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
                  <Image src={method.icon} alt={method.name} fill className="object-contain p-2" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{method.name}</h4>
                    {method.highlight ? <span className="rounded-full bg-sakura/15 px-2 py-0.5 text-[10px] font-bold text-sakura">Recommended</span> : null}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/55">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {method.estimate}
                    </span>
                    <span>Biaya admin {formatIDR(method.feeFlat)}</span>
                    {providerName ? <span>Route: {providerName}</span> : null}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Total perkiraan</p>
                <p className="mt-1 text-sm font-black text-white">{formatIDR(total + method.feeFlat + Math.round(total * method.feePercent / 100))}</p>
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-white/55">
                  {selected ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <CreditCard className="h-4 w-4 text-white/30" />}
                  {selected ? "Selected" : "Tap to choose"}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
