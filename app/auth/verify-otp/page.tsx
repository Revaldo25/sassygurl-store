"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  const handleChange = (element: any, index: number) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling) element.nextSibling.focus();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[400px]">
        <div className="glass-elite p-10 rounded-[3rem] border border-white/5 text-center space-y-8">
          <div className="w-20 h-20 bg-sakura/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-sakura" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Verifikasi 2FA</h1>
            <p className="text-zinc-500 text-xs font-medium px-4">Masukkan 6 digit kode yang kami kirimkan untuk mengamankan saldo Sultan.</p>
          </div>

          {/* OTP Input Fields */}
          <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                className="w-12 h-14 bg-zinc-900 border border-white/5 rounded-xl text-center text-xl font-black text-white focus:border-sakura outline-none transition-all"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
              />
            ))}
          </div>

          <button className="w-full py-5 rounded-2xl bg-sakura text-zinc-950 font-black text-xs uppercase tracking-widest shadow-[0_15px_30px_rgba(253,176,192,0.2)] hover:scale-[1.02] transition-all">
            VERIFIKASI SEKARANG
          </button>

          <div className="pt-4">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              Tidak menerima kode? <span className="text-sakura cursor-pointer">Kirim Ulang ({timer}s)</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}