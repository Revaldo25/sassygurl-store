"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, Loader2, BadgeCheck, Lock, ChevronRight, AlertCircle } from "lucide-react";
import { simulateUsername } from "@/lib/catalog";
import { z } from "zod";

// Zod Schema for strict input validation
const accountSchema = z.object({
  id: z.string().min(5, "User ID minimal 5 karakter").max(15, "User ID maksimal 15 karakter").regex(/^\d+$/, "User ID hanya boleh angka"),
  zone: z.string().max(8, "Zone maksimal 8 karakter").optional().or(z.literal("")),
});

type Props = {
  gameSlug: string;
  gameName: string;
  requiresZone?: boolean;
  mode?: "topup" | "joki";
  onResolved?: (payload: { id: string; zone?: string; username: string | null }) => void;
  stepLabel?: string;
  serverOptions?: string;
};

export default function AccountInput({
  gameSlug,
  gameName,
  requiresZone = true,
  mode = "topup",
  onResolved,
  stepLabel = "STEP 01",
  serverOptions,
}: Props) {
  const [id, setId] = useState("");
  const [zone, setZone] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when inputs are cleared or too short
    if (!id || id.length < 5) {
      setUsername(null);
      setErrorMsg(null);
      setLoading(false);
      onResolved?.({ id, zone, username: null });
      return;
    }

    const validation = accountSchema.safeParse({ id, zone: requiresZone ? zone : undefined });
    
    if (!validation.success) {
      // Defer error visibility until user pauses or blurs
      const firstError = validation.error.errors[0].message;
      if (touched) {
        setErrorMsg(firstError);
      }
      setUsername(null);
      setLoading(false);
      onResolved?.({ id, zone, username: null });
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    const controller = new AbortController();

    const fetchNickname = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/game/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameCode: gameSlug, targetId: id, zoneId: zone }),
          signal: controller.signal
        });
        const data = await res.json();
        
        if (data.success && data.data && data.data.nickname) {
          setUsername(data.data.nickname);
          onResolved?.({ id, zone, username: data.data.nickname });
        } else {
          setUsername(null);
          setErrorMsg(data.message === "Invalid user ID" ? "Silakan periksa kembali User ID Anda." : "ID tidak ditemukan. Periksa kembali.");
          onResolved?.({ id, zone, username: null });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setUsername(null);
        // Only show fetch error if the user hasn't started typing again
        setErrorMsg("Sistem sedang memvalidasi... silakan coba lagi.");
        onResolved?.({ id, zone, username: null });
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call slightly longer to wait for pause
    const timer = setTimeout(fetchNickname, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, zone, gameSlug, onResolved, requiresZone, touched]);

  const valid = Boolean(username);

  return (
    <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md md:p-6 transition-all duration-300">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/40">{stepLabel}</p>
          <h3 className="mt-1 text-lg font-bold text-white md:text-xl">{mode === "joki" ? "Data Akun" : `Input ID ${gameName}`}</h3>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold tracking-[0.22em] text-white/45">User ID</span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 focus-within:border-sakura/50">
            <User className="h-4 w-4 text-sakura/80" />
            <input
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setErrorMsg(null); // Clear error while typing
                setTouched(false);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Masukkan User ID"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              inputMode="numeric"
            />
          </div>
        </label>

        <label className={requiresZone ? "block" : "hidden"}>
          <span className="mb-2 block text-xs font-bold tracking-[0.22em] text-white/45">Zone / Server</span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 focus-within:border-sakura/50">
            <BadgeCheck className="h-4 w-4 text-cyan-300" />
            {serverOptions ? (
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none [&>option]:bg-zinc-900"
              >
                <option value="" disabled>Pilih Server</option>
                {serverOptions.split(',').map(s => s.trim()).filter(Boolean).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                value={zone}
              onChange={(e) => {
                setZone(e.target.value);
                setErrorMsg(null);
                setTouched(false);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Contoh: 1234"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
            )}
          </div>
        </label>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-3 text-sm text-orange-300 border border-orange-500/20"
          >
            <AlertCircle className="h-4 w-4 shrink-0 opacity-80" />
            <p>{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Nickname</p>
            <p className="mt-1 text-sm font-medium text-white">
              {loading ? (
                <span className="animate-pulse text-white/60">Mencari...</span>
              ) : valid ? (
                <span className="text-emerald-400 font-bold">{username}</span>
              ) : (
                <span className="text-white/30">Belum ditemukan</span>
              )}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-white/40">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
            ) : valid ? (
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <User className="h-4 w-4 text-white/20" />
            )}
          </div>
        </div>

        {/* Progress bar only appears during active request */}
        {loading && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-full rounded-full bg-white/20"
            />
          </div>
        )}
      </div>
    </section>
  );
}
