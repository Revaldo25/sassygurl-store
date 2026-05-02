"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  X,
  Tag,
} from "lucide-react";
import { formatIDR } from "@/lib/catalog";
import { PaymentGroup, PaymentMethod } from "@/lib/api-adapter";

type Props = {
  groups: PaymentGroup[];
  selectedCode?: string;
  onSelect: (method: PaymentMethod) => void;
  baseTotal?: number;
  onPromoApplied?: (code: string, discount: number) => void;
  accent?: string;
};

// Presets: which group keys start expanded
const DEFAULT_OPEN = new Set(["QRIS", "EWALLET"]);

export default function PaymentAccordion({
  groups,
  selectedCode,
  onSelect,
  baseTotal = 0,
  onPromoApplied,
  accent = "#FDB0C0",
}: Props) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(DEFAULT_OPEN));
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Auto-open the group that contains the selected method
  const selectedGroup = groups.find(g =>
    g.methods.some(m => m.code === selectedCode)
  );

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/promos/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: promoCode.trim(), amount: baseTotal }),
        }
      );
      const data = await res.json();
      if (data.success && data.data) {
        const discount = data.data.discountAmount ?? 0;
        setPromoApplied({ code: promoCode.trim(), discount });
        onPromoApplied?.(promoCode.trim(), discount);
        setPromoCode("");
      } else {
        setPromoError(data.message || "Kode promo tidak valid.");
      }
    } catch {
      setPromoError("Gagal memeriksa promo. Coba lagi.");
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div>
      {/* ── Accordion groups ─────────────────────────────────────── */}
      <div className="divide-y divide-white/5">
        {groups.map(group => {
          const isOpen = openGroups.has(group.groupKey);
          const hasSelected = group.methods.some(m => m.code === selectedCode);

          return (
            <div key={group.groupKey}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.groupKey)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] md:px-7"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{group.countryFlag}</span>
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-white">
                    {group.groupLabel}
                  </span>
                  {hasSelected && (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      Selected
                    </span>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-white/40" />
                </motion.div>
              </button>

              {/* Group content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Logo chip grid — exactly like image_67.png */}
                    <div className="flex flex-wrap gap-2 px-5 pb-4 pt-1 md:px-7">
                      {group.methods.map(method => {
                        const selected = method.code === selectedCode;
                        const methodTotal =
                          baseTotal +
                          method.feeFlat +
                          Math.round((baseTotal * method.feePercent) / 100);

                        return (
                          <button
                            key={method.code}
                            onClick={() => {
                              onSelect(method);
                              // Auto-open the group when selected from outside
                              if (!openGroups.has(group.groupKey)) {
                                toggleGroup(group.groupKey);
                              }
                            }}
                            title={`${method.name} — ${formatIDR(methodTotal)}`}
                            className={[
                              "relative flex h-14 items-center justify-center overflow-hidden rounded-xl border px-3 transition-all duration-200",
                              selected
                                ? "border-sakura/60 bg-sakura/10 shadow-[0_0_16px_rgba(253,176,192,0.18)]"
                                : "border-white/10 bg-white hover:border-white/30 hover:shadow-md",
                            ].join(" ")}
                          >
                            <div className="relative h-8 w-14">
                              <Image
                                src={method.logo || "/images/payments/default.webp"}
                                alt={method.name}
                                fill
                                className="object-contain"
                              />
                            </div>

                            {/* Selected overlay checkmark */}
                            {selected && (
                              <span
                                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full"
                                style={{ backgroundColor: accent }}
                              >
                                <CheckCircle2 className="h-3 w-3 text-zinc-950" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected method detail */}
                    {hasSelected && (
                      <div className="mx-5 mb-4 rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 md:mx-7">
                        {(() => {
                          const m = group.methods.find(m => m.code === selectedCode)!;
                          const mTotal =
                            baseTotal +
                            m.feeFlat +
                            Math.round((baseTotal * m.feePercent) / 100);
                          return (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold text-white">{m.name}</p>
                                <p className="mt-0.5 text-[11px] text-white/45">
                                  {m.feeFlat > 0
                                    ? `Admin: ${formatIDR(m.feeFlat)}`
                                    : m.feePercent > 0
                                    ? `Fee: ${m.feePercent}%`
                                    : "Tanpa biaya admin"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-white/40">Total</p>
                                <p className="text-sm font-black text-white">{formatIDR(mTotal)}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Promo Code ────────────────────────────────────────────── */}
      <div className="border-t border-white/8 px-5 py-5 md:px-7">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35">
          <Tag className="h-3 w-3 text-sakura/60" />
          Kode Promo
        </p>

        {promoApplied ? (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-emerald-300">✓ Promo aktif: {promoApplied.code}</p>
              <p className="mt-0.5 text-xs text-emerald-300/70">
                Hemat {formatIDR(promoApplied.discount)}
              </p>
            </div>
            <button
              onClick={() => {
                setPromoApplied(null);
                onPromoApplied?.("", 0);
              }}
              className="rounded-full p-1 text-white/40 hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={e => {
                setPromoCode(e.target.value.toUpperCase());
                setPromoError("");
              }}
              onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
              placeholder="Masukkan kode promo..."
              className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-sakura/40 transition-colors"
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-zinc-950 transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              {promoLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Pakai
            </button>
          </div>
        )}
        {promoError && (
          <p className="mt-2 text-xs text-rose-400">{promoError}</p>
        )}
      </div>
    </div>
  );
}
