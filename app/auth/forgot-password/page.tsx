"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mail, Phone, Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, XCircle, KeyRound, ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordElitePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // States
  const [identity, setIdentity] = useState(""); 
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); 
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const rules = {
    length: newPassword.length >= 8 && newPassword.length <= 32,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(rules).every(Boolean);
  const isOtpComplete = otp.join("").length === 6;

  // --- Handlers ---
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return setErrorMsg("Masukkan Email atau Nomor WA Anda.");
    setErrorMsg(""); setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1500);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpComplete) return setErrorMsg("Masukkan 6 digit kode keamanan.");
    setErrorMsg(""); setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return setErrorMsg("Penuhi syarat keamanan password.");
    if (newPassword !== confirmPassword) return setErrorMsg("Password tidak cocok.");
    setErrorMsg(""); setLoading(true);
    setTimeout(() => { setLoading(false); router.push("/auth/login?reset=success"); }, 2000);
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  // --- Animasi & CSS ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
  const stepVariants: Variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  const inputBaseClass = "w-full bg-black/40 border border-white/10 rounded-2xl pl-12 py-4 text-sm font-semibold text-white focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 outline-none transition-all duration-300 placeholder:text-zinc-600 hover:border-white/20 shadow-inner truncate [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#09090b] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:transition-none";

  return (
    <div className="h-screen flex bg-zinc-950 font-sans selection:bg-cyan-400 selection:text-zinc-900 overflow-hidden">
      
      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex w-5/12 bg-zinc-950 relative flex-col justify-between p-12 border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950"></div>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-400/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-white tracking-tighter">
            SASSYGURL<span className="text-sakura">.</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">Recovery Protocol</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="relative w-72 h-72 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[1px] border-dashed border-zinc-700 rounded-full" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border-[1px] border-white/5 rounded-full" />
            
            <motion.div animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 40px rgba(34, 211, 238, 0.2)", "0 0 80px rgba(34, 211, 238, 0.4)", "0 0 40px rgba(34, 211, 238, 0.2)"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 w-40 h-40 bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/10 rounded-full flex flex-col items-center justify-center backdrop-blur-2xl">
              <AnimatePresence mode="wait">
                {step === 1 && <motion.div key="1" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}><ShieldAlert className="w-14 h-14 text-zinc-400" /></motion.div>}
                {step === 2 && <motion.div key="2" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}><KeyRound className="w-14 h-14 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" /></motion.div>}
                {step === 3 && <motion.div key="3" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}><Lock className="w-14 h-14 text-sakura drop-shadow-[0_0_15px_rgba(253,176,192,0.5)]" /></motion.div>}
              </AnimatePresence>
            </motion.div>
            
            <div className="absolute top-1/2 -left-32 w-32 h-[1px] bg-gradient-to-r from-transparent to-cyan-400/50" />
            <div className="absolute top-1/2 -right-32 w-32 h-[1px] bg-gradient-to-l from-transparent to-cyan-400/50" />
          </div>

          <div className="mt-12 text-center space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 && <motion.h1 key="h1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-3xl font-black text-white tracking-tight">Otorisasi Identitas</motion.h1>}
              {step === 2 && <motion.h1 key="h2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">Verifikasi 2-Arah</motion.h1>}
              {step === 3 && <motion.h1 key="h3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sakura to-pink-500 tracking-tight">Enkripsi Sandi Baru</motion.h1>}
            </AnimatePresence>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] max-w-[250px] mx-auto leading-relaxed">Jalur aman dilindungi oleh lapisan AES-256 Bit.</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]"><span>Sistem Pemulihan VIP</span></div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="w-full lg:w-7/12 h-screen overflow-y-auto no-scrollbar relative bg-[url('/noise.png')] bg-repeat opacity-95">
        <div className="fixed top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] bg-cyan-400/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="min-h-full flex flex-col justify-center p-4 py-12 sm:p-12 relative z-10">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-[500px] mx-auto">
            <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              
              <AnimatePresence mode="wait">
                
                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                    <div className="mb-8">
                      <Link href="/auth/login" className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors mb-6"><ArrowLeft className="w-3 h-3" /> Kembali ke Login</Link>
                      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Lupa Password?</h2>
                      <p className="text-zinc-400 text-sm font-medium leading-relaxed">Jangan khawatir. Masukkan Email atau Nomor WhatsApp yang terdaftar, kami akan mengirimkan instruksi pemulihan.</p>
                    </div>

                    <form onSubmit={handleRequestReset} className="space-y-6">
                      {errorMsg && <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wide"><AlertCircle className="w-5 h-5 shrink-0" />{errorMsg}</div>}
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Identitas Akun</label>
                        <div className="group relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 group-focus-within:text-cyan-400 transition-colors z-10" />
                          <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Email atau Nomor WhatsApp" className={inputBaseClass} />
                        </div>
                      </div>

                      <button type="submit" disabled={loading || !identity} className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 active:scale-[0.98] ${identity ? "bg-white text-zinc-950 hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]" : "bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed"}`}>
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Kirim Kode Keamanan <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                    <div className="mb-8">
                      <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors mb-6"><ArrowLeft className="w-3 h-3" /> Ganti Identitas</button>
                      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Verifikasi Kode</h2>
                      <p className="text-zinc-400 text-sm font-medium leading-relaxed">Kami telah mengirimkan 6 digit kode keamanan ke <span className="text-cyan-400 font-bold">{identity}</span>.</p>
                    </div>

                    <form onSubmit={handleVerifyOTP} className="space-y-8">
                      {errorMsg && <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wide"><AlertCircle className="w-5 h-5 shrink-0" />{errorMsg}</div>}
                      
                      <div className="flex justify-between gap-2 sm:gap-3">
                        {otp.map((data, index) => (
                          <input key={index} type="text" maxLength={1} value={data} onChange={(e) => handleOtpChange(e.target, index)} onFocus={(e) => e.target.select()}
                            className="w-10 h-14 sm:w-12 sm:h-16 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-black text-white focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 outline-none transition-all shadow-inner"
                          />
                        ))}
                      </div>

                      {/* TOMBOL PINTAR: Menyala saat 6 digit lengkap! */}
                      <button type="submit" disabled={loading || !isOtpComplete} className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 active:scale-[0.98] ${isOtpComplete ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]" : "bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed"}`}>
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Verifikasi Sekarang <ShieldCheck className="w-5 h-5" /></>}
                      </button>

                      <div className="text-center">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Belum menerima kode? <button type="button" className="text-white hover:text-cyan-400 transition-colors">Kirim Ulang</button></p>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <motion.div key="step3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
                    <div className="mb-8">
                      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Buat Sandi Baru</h2>
                      <p className="text-zinc-400 text-sm font-medium leading-relaxed">Keamanan adalah prioritas. Ciptakan password baru yang kuat untuk melindungi aset Anda.</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-6">
                      {errorMsg && <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wide"><AlertCircle className="w-5 h-5 shrink-0" />{errorMsg}</div>}
                      
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Sandi Baru</label>
                          <div className="group relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 group-focus-within:text-sakura transition-colors z-10" />
                            <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Masukkan sandi super aman" className={`${inputBaseClass.replace('focus:border-cyan-400', 'focus:border-sakura focus:ring-sakura/10')} pr-12`} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10">
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <AnimatePresence>
                            {newPassword.length > 0 && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-3 grid grid-cols-2 gap-3 overflow-hidden">
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${rules.length ? "text-emerald-400" : "text-zinc-500"}`}>{rules.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} 8-32 Karakter</div>
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${rules.uppercase ? "text-emerald-400" : "text-zinc-500"}`}>{rules.uppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} Huruf Besar</div>
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${rules.number ? "text-emerald-400" : "text-zinc-500"}`}>{rules.number ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} Angka</div>
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${rules.special ? "text-emerald-400" : "text-zinc-500"}`}>{rules.special ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} Simbol Unik</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Konfirmasi Sandi Baru</label>
                          <div className="group relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 group-focus-within:text-sakura transition-colors z-10" />
                            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi sandi baru" className={`${inputBaseClass.replace('focus:border-cyan-400', 'focus:border-sakura focus:ring-sakura/10')} pr-12`} />
                          </div>
                        </div>
                      </div>

                      <button type="submit" disabled={loading || !isPasswordValid} className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 active:scale-[0.98] ${isPasswordValid ? "bg-gradient-to-r from-sakura to-pink-500 text-white shadow-[0_0_30px_rgba(253,176,192,0.3)] hover:shadow-[0_0_40px_rgba(253,176,192,0.6)]" : "bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed"}`}>
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Simpan Password Baru <CheckCircle2 className="w-5 h-5" /></>}
                      </button>
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
              
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}