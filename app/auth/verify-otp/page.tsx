"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyOtpAction } from "@/app/actions/auth";
import { toast } from "sonner";
import Link from "next/link";

import { Suspense } from "react";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const identifier = searchParams.get("identifier") || "Email / Nomor WA";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const isOtpComplete = otp.join("").length === 6;

  const handleChange = (element: any, index: number) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== "") element.nextSibling.focus();
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async () => {
    if (!isOtpComplete) return;
    setLoading(true);
    setErrorMsg("");
    const res = await verifyOtpAction(identifier, otp.join(""));
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      router.push("/dashboard");
    } else {
      setErrorMsg(res.message);
      setOtp(["", "", "", "", "", ""]); // reset on fail
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resendLoading) return;
    setResendLoading(true);
    
    // Simulating API call for resend OTP
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResendLoading(false);
    toast.success(`Kode OTP baru telah dikirim ke ${identifier}`);
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[400px]">
        <div className="glass-panel p-10 rounded-[3rem] border border-white/5 text-center space-y-8 relative">
          <Link href="/auth/login" className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="w-20 h-20 bg-sakura/10 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
            <ShieldCheck className="w-10 h-10 text-sakura" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Verifikasi 2FA</h1>
            <p className="text-zinc-500 text-xs font-medium px-4">Masukkan 6 digit kode yang kami kirimkan ke <span className="text-sakura font-bold">{identifier}</span> untuk mengamankan saldo Sultan.</p>
          </div>

          {errorMsg && <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger text-[10px] font-bold uppercase tracking-wide"><AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}</div>}

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

          <button 
            onClick={handleVerify}
            disabled={loading || !isOtpComplete}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 ${isOtpComplete ? "bg-sakura text-zinc-950 shadow-[0_15px_30px_rgba(253,176,192,0.2)] hover:scale-[1.02]" : "bg-white/5 text-zinc-500 cursor-not-allowed"}`}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "VERIFIKASI SEKARANG"}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              Tidak menerima kode?{" "}
              <button 
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || resendLoading}
                className={`transition-all duration-300 ${timer > 0 ? "text-zinc-700 cursor-not-allowed" : "text-sakura hover:text-pink-400 cursor-pointer"}`}
              >
                {resendLoading ? "MENGIRIM..." : timer > 0 ? `Kirim Ulang (${timer}s)` : "Kirim Ulang"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}

