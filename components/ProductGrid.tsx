"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Flame, Medal, Sparkles } from "lucide-react";
import { Product, formatIDR, getBestProvider } from "@/lib/catalog";

type Props = {
  title?: string;
  products: Product[];
  selectedSku?: string;
  onSelect: (product: Product) => void;
  accent?: string;
};

export default function ProductGrid({ title = "Pilih Produk", products, selectedSku, onSelect, accent = "#FDB0C0" }: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-3xl md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">STEP 02</p>
          <h3 className="mt-1 text-xl font-black text-white md:text-2xl">{title}</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-4 py-2 text-xs font-semibold text-white/70">
          <Sparkles className="h-4 w-4 text-sakura" />
          Smart provider routing aktif
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product, index) => {
          const selected = selectedSku === product.sku;
          const provider = getBestProvider(product);
          return (
            <motion.button
              key={product.sku}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%"}}
              transition={{ delay: index * 0.035, duration: 0.35 }}
              onClick={() => onSelect(product)}
              className={[
                "group relative overflow-hidden rounded-[1.6rem] border p-3 text-left transition",
                selected
                  ? "border-sakura/60 bg-sakura/10 shadow-[0_0_30px_rgba(253,176,192,0.18)]"
                  : "border-white/10 bg-zinc-950/50 hover:border-white/25 hover:bg-white/[0.08]",
              ].join(" ")}
            >
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: `radial-gradient(circle at top left, ${accent}22, transparent 55%)` }} />
              <div className="relative flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <Image src={product.image} alt={product.name} fill className="object-contain p-2.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{product.kind}</p>
                      <h4 className="mt-1 text-sm font-bold text-white line-clamp-2">{product.name}</h4>
                    </div>
                    {selected ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sakura text-zinc-950">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {product.isBestValue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                        <Medal className="h-3 w-3" />
                        Best Value
                      </span>
                    ) : product.isHot ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-300">
                        <Flame className="h-3 w-3" />
                        Hot
                      </span>
                    ) : product.isPopular ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sakura/15 px-2.5 py-1 text-[10px] font-bold text-sakura">
                        Popular
                      </span>
                    ) : null}
                    {product.label ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/55">
                        {product.label}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.26em] text-white/35">Harga mulai</p>
                      <p className="mt-1 text-base font-black text-white">{formatIDR(provider.price)}</p>
                    </div>
                    <div className="text-right text-[11px] leading-4 text-white/50">
                      <p>Route: {provider.name}</p>
                      <p>{product.amount ? `${product.amount} nominal` : "Instant product"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
