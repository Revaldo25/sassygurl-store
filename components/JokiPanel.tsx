"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, EyeOff, Copy } from "lucide-react";

export default function JokiPanel() {
  const [notes, setNotes] = useState("");
  const [loginMethod, setLoginMethod] = useState<"guest" | "bind" | "manual">("guest");
  const [target, setTarget] = useState("");

  return (
    <section className="rounded-[2rem] border border-cyan-400/15 bg-cyan-400/5 p-4 backdrop-blur-3xl md:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.4em] text-cyan-200/80">ENCRYPTED JOKI PANEL</p>
          <h3 className="mt-1 text-xl font-black text-white md:text-2xl">Panel Joki Aman</h3>
          <p className="mt-2 text-sm text-white/60">
            Data akun ditulis sebagai preview terenkripsi di UI. Backend asli nanti bisa pakai enkripsi server-side.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-200">
          <Lock className="h-4 w-4" />
          Secure mode
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold tracking-[0.22em] text-white/45">Target Rank</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Contoh: Mythic Honor"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold tracking-[0.22em] text-white/45">Login Method</span>
          <select
            value={loginMethod}
            onChange={(e) => setLoginMethod(e.target.value as any)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
          >
            <option value="guest">Guest</option>
            <option value="bind">Bind</option>
            <option value="manual">Manual</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-2 block text-xs font-bold tracking-[0.22em] text-white/45">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Masukkan catatan joki, preferensi hero, jam pengerjaan..."
          className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black tracking-[0.2em] text-zinc-950">
          <ShieldCheck className="h-4 w-4" />
          Simpan Secure Draft
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
          <EyeOff className="h-4 w-4" />
          Hide sensitive data
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
          <Copy className="h-4 w-4" />
          Copy encrypted note
        </button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-xs leading-6 text-white/45"
      >
        Preview: {target || "—"} • {loginMethod.toUpperCase()} • {notes ? "Encrypted" : "Waiting input"}
      </motion.p>
    </section>
  );
}
