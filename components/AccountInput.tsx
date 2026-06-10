"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, Loader2, BadgeCheck, Lock, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const accountSchema = z.object({
  id: z.string().min(5, "User ID minimal 5 karakter").max(15, "User ID maksimal 15 karakter").regex(/^\\d+$/, "User ID hanya boleh angka"),
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
    if (!id || id.length < 5) {
      setUsername(null);
      setErrorMsg(null);
      setLoading(false);
      onResolved?.({ id, zone, username: null });
      return;
    }

    const validation = accountSchema.safeParse({ id, zone: requiresZone ? zone : undefined });
    
    if (!validation.success) {
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
        setErrorMsg("Sistem sedang memvalidasi... silakan coba lagi.");
        onResolved?.({ id, zone, username: null });
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchNickname, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, zone, gameSlug, onResolved, requiresZone, touched]);

  const valid = Boolean(username);

  return (
    <section className="glass-panel rounded-3xl p-5 md:p-8 transition-all duration-300 relative overflow-hidden group">
      {/* Background Glow when active */}
      <div className={`absolute inset-0 opacity-0 transition-opacity duration-1000 pointer-events-none ${valid ? 'opacity-20' : 'group-focus-within:opacity-10'}`} style={{ background: 'radial-gradient(circle at top right, rgba(253,176,192,0.4), transparent 60%)' }} />

      <div className="relative z-10 mb-6 flex items-start gap-4">
        <div 
          className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-inner"
          style={valid 
            ? { backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", boxShadow: "0 0 20px rgba(16,185,129,0.1)" } 
            : { backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
          }
        >
          {valid ? <CheckCircle2 className="w-5 h-5" /> : <User className="w-5 h-5 drop-shadow-md" />}
        </div>
        <div className="pt-1">
          <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-0.5">{stepLabel}</p>
          <h3 className="text-xl font-bold text-white tracking-tight leading-none">{mode === "joki" ? "Data Akun Joki" : `Informasi Akun ${gameName}`}</h3>
        </div>
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold tracking-wider text-zinc-400 uppercase">User ID</span>
          <div className="flex items-center gap-3 rounded-2xl border border-obsidian-border bg-obsidian-surface/60 px-4 py-3.5 focus-within:border-sakura/50 focus-within:bg-obsidian-surface transition-all duration-300 shadow-inner">
            <User className="h-4 w-4 text-sakura" />
            <input
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setErrorMsg(null);
                setTouched(false);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Masukkan User ID"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 font-semibold"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
        </label>

        <label className={requiresZone ? "block" : "hidden"}>
          <span className="mb-2 block text-[11px] font-bold tracking-wider text-zinc-400 uppercase">Zone / Server</span>
          <div className="flex items-center gap-3 rounded-2xl border border-obsidian-border bg-obsidian-surface/60 px-4 py-3.5 focus-within:border-sakura/50 focus-within:bg-obsidian-surface transition-all duration-300 shadow-inner">
            <BadgeCheck className="h-4 w-4 text-cyan-400" />
            {serverOptions ? (
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none [&>option]:bg-obsidian"
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
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600 font-semibold"
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
            className="relative z-10 mt-4 flex items-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 border border-rose-500/20"
          >
            <AlertCircle className="h-4 w-4 shrink-0 opacity-80" />
            <p className="font-medium">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mt-6 rounded-2xl border border-obsidian-border bg-obsidian-surface/40 p-5 shadow-inner" aria-live="polite">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nickname Pemain</p>
            <p className="mt-1 text-sm font-bold text-white">
              {loading ? (
                <span className="animate-pulse text-zinc-400">Mencari di server...</span>
              ) : valid ? (
                <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">{username}</span>
              ) : (
                <span className="text-zinc-600">Belum terverifikasi</span>
              )}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-white/40">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : valid ? (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
              </div>
            ) : (
              <User className="h-4 w-4 text-zinc-600" />
            )}
          </div>
        </div>

        {loading && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-obsidian-surface">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-full rounded-full bg-sakura shadow-[0_0_10px_rgba(253,176,192,0.5)]"
            />
          </div>
        )}
      </div>
    </section>
  );
}
