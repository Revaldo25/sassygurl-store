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
};

export default function AccountInput({
  gameSlug,
  gameName,
  requiresZone = true,
  mode = "topup",
  onResolved,
  stepLabel = "STEP 01",
}: Props) {
  const [id, setId] = useState("");
  const [zone, setZone] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const validation = accountSchema.safeParse({ id, zone: requiresZone ? zone : undefined });
    
    if (!validation.success) {
      if (touched) {
        setErrorMsg(validation.error.errors[0].message);
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
          setErrorMsg(data.message || "Nickname tidak ditemukan");
          onResolved?.({ id, zone, username: null });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setUsername(null);
        setErrorMsg("Gagal memvalidasi ID");
        onResolved?.({ id, zone, username: null });
      } finally {
        setLoading(false);
      }
    };

    // Debounce the API call slightly
    const timer = setTimeout(fetchNickname, 720);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, zone, gameSlug, onResolved, requiresZone, touched]);

  const valid = Boolean(username);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-4 backdrop-blur-3xl md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">{stepLabel}</p>
          <h3 className="mt-1 text-xl font-black text-white md:text-2xl">{mode === "joki" ? "Data Akun Joki" : `Input ID ${gameName}`}</h3>
          <p className="mt-2 text-sm text-white/60">
            Nickname akan divalidasi otomatis seperti API premium. Fokus pada keamanan, kecepatan, dan hasil yang rapi.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-4 py-2 text-xs font-semibold text-white/70">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Encrypted preview
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold tracking-[0.22em] text-white/45">User ID</span>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 focus-within:border-sakura/50">
            <User className="h-4 w-4 text-sakura/80" />
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
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
            <input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Contoh: 1234"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </div>
        </label>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Nickname</p>
            <p className="mt-1 text-base font-bold text-white">
              {loading ? "Memverifikasi..." : valid ? username : "Menunggu input valid"}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-white/55">
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-sakura" /> : valid ? <Lock className="h-4 w-4 text-emerald-300" /> : <ChevronRight className="h-4 w-4 text-white/35" />}
            {valid ? "Validated" : "Secure Check"}
          </div>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: valid ? "100%" : touched ? "45%" : "0%" }}
            transition={{ duration: 0.55 }}
            className="h-full rounded-full bg-gradient-to-r from-sakura via-fuchsia-400 to-cyan-300"
          />
        </div>

        <p className="mt-3 text-xs leading-6 text-white/50">
          Nickname tidak disimpan di browser. Komponen ini menampilkan validasi real-time dari CheckNickname.
        </p>
      </div>
    </section>
  );
}
