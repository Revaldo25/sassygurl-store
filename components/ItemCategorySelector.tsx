"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Zap, Tag } from "lucide-react";
import { formatIDR } from "@/lib/catalog";
import {
  NormalizedGame,
  NormalizedProduct,
  GroupedProducts,
} from "@/lib/api-adapter";

type Props = {
  game: NormalizedGame;
  groupedByCategory: GroupedProducts[];
  products: NormalizedProduct[];
  selectedSku?: string;
  onSelect: (product: NormalizedProduct) => void;
  accent?: string;
};

export default function ItemCategorySelector({
  game,
  groupedByCategory,
  products,
  selectedSku,
  onSelect,
  accent = "#FDB0C0",
}: Props) {
  // If backend returned grouped data, use it; otherwise fall back to client-side grouping
  const groups: GroupedProducts[] = useMemo(() => {
    if (groupedByCategory.length > 0) return groupedByCategory;

    // Client-side fallback grouping
    const map = new Map<string, GroupedProducts>();
    for (const p of products) {
      const key = p.itemCategory;
      if (!map.has(key)) {
        map.set(key, {
          category: {
            slug:      p.itemCategory,
            label:     p.itemCategoryLabel,
            icon:      p.itemCategoryIcon,
            itemCount: 0,
            sortOrder: 0,
          },
          items: [],
        });
      }
      map.get(key)!.items.push(p);
      map.get(key)!.category.itemCount++;
    }
    return Array.from(map.values());
  }, [groupedByCategory, products]);

  const [activeCategory, setActiveCategory] = useState<string>(
    groups[0]?.category.slug ?? "CURRENCY"
  );

  const activeGroup = useMemo(
    () => groups.find(g => g.category.slug === activeCategory),
    [groups, activeCategory]
  );

  const selectedProduct = products.find(p => p.sku === selectedSku);

  return (
    <div>
      {/* ── Category Tabs ─────────────────────────────────────────── */}
      {groups.length > 1 && (
        <div className="border-b border-white/8 px-4 py-3 md:px-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-white/35">
            Pilih Kategori
          </p>
          <div className="flex flex-wrap gap-2">
            {groups.map(g => {
              const isActive = activeCategory === g.category.slug;
              return (
                <button
                  key={g.category.slug}
                  onClick={() => setActiveCategory(g.category.slug)}
                  className={[
                    "group flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all duration-200",
                    isActive
                      ? "border-sakura/40 bg-sakura/15 text-sakura shadow-[0_0_14px_rgba(253,176,192,0.14)]"
                      : "border-white/10 bg-zinc-950/50 text-white/55 hover:border-white/20 hover:text-white/80",
                  ].join(" ")}
                >
                  {/* Category icon (emoji) */}
                  <span className="text-base leading-none">{g.category.icon}</span>
                  <span>{g.category.label}</span>
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                      isActive
                        ? "bg-sakura/25 text-sakura"
                        : "bg-white/10 text-white/40",
                    ].join(" ")}
                  >
                    {g.category.itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Item Grid ─────────────────────────────────────────────── */}
      <div className="p-4 md:p-6">
        {activeGroup && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-white/35">
              Pilih Item — {activeGroup.category.label}
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4"
              >
                {activeGroup.items.map((product, index) => {
                  const selected = selectedSku === product.sku;
                  return (
                    <ItemCard
                      key={product.sku}
                      product={product}
                      selected={selected}
                      onSelect={onSelect}
                      accent={accent}
                      index={index}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {activeGroup.items.length === 0 && (
              <div className="py-12 text-center">
                <Tag className="mx-auto h-8 w-8 text-white/20" />
                <p className="mt-3 text-sm text-white/40">
                  Tidak ada item untuk kategori ini.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Item Card (Ditusi-style compact card with thumbnail) ─────────────────────
function ItemCard({
  product,
  selected,
  onSelect,
  accent,
  index,
}: {
  product: NormalizedProduct;
  selected: boolean;
  onSelect: (p: NormalizedProduct) => void;
  accent: string;
  index: number;
}) {
  const hasDiscount =
    product.discountPercent > 0 ||
    (product.originalPrice !== undefined && product.originalPrice > product.displayPrice);

  const discountPct =
    product.discountPercent > 0
      ? product.discountPercent
      : product.originalPrice && product.originalPrice > product.displayPrice
      ? Math.round(
          ((product.originalPrice - product.displayPrice) / product.originalPrice) * 100
        )
      : 0;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ delay: index * 0.025, duration: 0.22 }}
      onClick={() => onSelect(product)}
      className={[
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
        selected
          ? "border-sakura/60 bg-sakura/10 shadow-[0_0_24px_rgba(253,176,192,0.2)]"
          : "border-white/10 bg-zinc-950/60 hover:border-white/25 hover:bg-white/[0.07]",
      ].join(" ")}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          onError={() => {/* handled by next/image fallback */}}
        />

        {/* Discount badge — top left */}
        {discountPct > 0 && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-lg bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-black text-white backdrop-blur-sm">
            -{discountPct}%
          </span>
        )}

        {/* Flash Sale badge */}
        {product.isFlashSale && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-lg bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-black text-white">
            <Flame className="h-2.5 w-2.5" />
            SALE
          </span>
        )}

        {/* Selected checkmark — top right */}
        {selected && (
          <span
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-zinc-950"
            style={{ backgroundColor: accent }}
          >
            <Check className="h-4 w-4" />
          </span>
        )}

        {/* Hover accent overlay */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(to top, ${accent}30, transparent 60%)`,
          }}
        />
      </div>

      {/* Info area */}
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-bold leading-snug text-white">
          {product.name}
        </p>

        <div className="mt-2">
          {product.originalPrice && product.originalPrice > product.displayPrice && (
            <p className="text-[10px] text-white/30 line-through">
              {formatIDR(product.originalPrice)}
            </p>
          )}
          <p
            className="text-sm font-black"
            style={{ color: selected ? accent : "white" }}
          >
            {product.displayPrice === 0 ? "Gratis" : formatIDR(product.displayPrice)}
          </p>
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
          <Zap className="h-2.5 w-2.5" />
          <span>Instan</span>
        </div>
      </div>

      {/* Active accent bottom bar */}
      {selected && (
        <motion.div
          layoutId="active-item-bar"
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: accent }}
        />
      )}
    </motion.button>
  );
}
