"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, CheckCircle2, 
  AlertCircle, Eye, EyeOff, XCircle, Cpu 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// Mengambil Ikon Sultan dari komponen yang baru kita buat
import { 
  PremiumUser, 
  PremiumMail, 
  PremiumPhone, 
  PremiumLock 
} from "@/components/PremiumIcons";

export default function RegisterElitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: ""
  });

  // Password Validation Engine
  const rules = {
    length: formData.password.length >= 8 && formData.password.length <= 32,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };
  
  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isPasswordValid) return setErrorMsg("Mohon penuhi semua syarat keamanan password.");
    if (formData.password !== formData.confirmPassword) return setErrorMsg("Password tidak cocok.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name, email: formData.email, phone: formData.phone, password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registrasi ditolak sistem.");
      router.push("/auth/login?registered=true");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Presisi Animasi ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // CSS Sakti: Anti-Autofill & Truncate
  const inputBaseClass = "w-full bg-black/40 border border-white/10 rounded-2xl pl-14 py-4 text-sm font-semibold text-white focus:border-sakura focus:ring-4 focus:ring-sakura/10 outline-none transition-all duration-300 placeholder:text-zinc-600 hover:border-white/20 shadow-inner truncate [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#09090b] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:transition-none";

  return (
    <div className="h-screen flex bg-zinc-950 font-sans selection:bg-sakura selection:text-zinc-900 overflow-hidden">
      
      {/* ================= LEFT PANEL: THE VIP CARD ================= */}
      <div className="hidden lg:flex w-5/12 bg-zinc-950 relative flex-col justify-between p-12 border-r border-white/5">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sakura/20 blur-[120px] rounded-full pointer-events-none" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-cyan/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-white tracking-tighter">SASSYGURL<span className="text-sakura">.</span></Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-sakura" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase italic">Ultra Precision 4K</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center perspective-[1000px]">
          <motion.div 
            animate={{ y: [-15, 15, -15], rotateX: [5, -5, 5], rotateY: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-[380px] h-[240px] rounded-[2.5rem] bg-gradient-to-br from-zinc-800/80 to-zinc-950/80 border border-white/10 backdrop-blur-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] p-8 flex flex-col justify-between overflow-hidden relative"
          >
            <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 1 }} className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg]" />
            <div className="flex justify-between items-start relative z-10">
              <Cpu className="w-10 h-10 text-zinc-500" />
              <span className="text-sakura font-black tracking-[0.4em] text-2xl drop-shadow-[0_0_20px_rgba(253,176,192,0.6)]">VIP</span>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="text-zinc-500 font-mono text-lg tracking-[0.4em]">**** **** **** 2026</div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Elite Member</div>
                  <div className="text-white font-black tracking-widest uppercase text-sm truncate max-w-[200px]">{formData.name || "SULTAN SASSY"}</div>
                </div>
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-sakura/80 backdrop-blur-md" />
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/80 backdrop-blur-md" />
                </div>
              </div>
            </div>
          </motion.div>
          <div className="mt-14 text-center space-y-5">
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tighter">Akses Ekosistem <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sakura to-brand-cyan drop-shadow-sm">Tanpa Batas.</span></h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Corporate Grade Authentication</p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT PANEL: THE PREMIUM FORM ================= */}
      <div className="w-full lg:w-7/12 h-screen overflow-y-auto no-scrollbar relative bg-[url('/noise.png')] bg-repeat opacity-95">
        <div className="fixed top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] bg-sakura/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="min-h-full flex flex-col justify-center p-4 py-12 sm:p-12 relative z-10">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-[550px] mx-auto">
            <div className="bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 sm:p-14 shadow-[0_0_100px_rgba(0,0,0,0.6)]">
              
              <motion.div variants={itemVariants} className="mb-12">
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">Buat Akun VIP</h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-sm">Lengkapi identitas elit Anda untuk pengalaman transaksi yang aman & eksklusif.</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
                        <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-xs font-black uppercase tracking-widest">{errorMsg}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  {/* NAMA LENGKAP */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">Nama Lengkap</label>
                    <div className="group relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110"><PremiumUser /></div>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Sesuai kartu identitas" className={inputBaseClass} />
                    </div>
                  </motion.div>

                  {/* EMAIL */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">Email Aktif</label>
                    <div className="group relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110"><PremiumMail /></div>
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="alamat@email.com" className={inputBaseClass} />
                    </div>
                  </motion.div>
                  
                  {/* WHATSAPP */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">Nomor WhatsApp</label>
                    <div className="group relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110"><PremiumPhone /></div>
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="Contoh: 0812345678" className={inputBaseClass} />
                    </div>
                  </motion.div>

                  {/* PASSWORD */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] pl-1">Keamanan Password</label>
                    <div className="group relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110"><PremiumLock /></div>
                      <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="Ciptakan sandi kuat" className={`${inputBaseClass} pr-14`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                    </div>
                    {/* Dynamic Rules Checklist */}
                    <AnimatePresence>
                      {formData.password.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-4 grid grid-cols-2 gap-4 overflow-hidden border-t border-white/5 mt-2">
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${rules.length ? "text-emerald-400" : "text-zinc-600"}`}>{rules.length ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} 8-32 Karakter</div>
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${rules.uppercase ? "text-emerald-400" : "text-zinc-600"}`}>{rules.uppercase ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} Huruf Besar</div>
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${rules.number ? "text-emerald-400" : "text-zinc-600"}`}>{rules.number ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} Angka</div>
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${rules.special ? "text-emerald-400" : "text-zinc-600"}`}>{rules.special ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} Simbol Unik</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* CONFIRM PASSWORD */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="group relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110"><PremiumLock /></div>
                      <input type={showConfirm ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="Ulangi sandi elit Anda" className={`${inputBaseClass} pr-14`} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10">{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="pt-6">
                  <button type="submit" disabled={loading || !isPasswordValid} className={`w-full py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-700 active:scale-[0.97] relative overflow-hidden ${isPasswordValid ? "bg-gradient-to-r from-sakura via-pink-500 to-sakura bg-[length:200%_auto] hover:bg-right text-white shadow-[0_20px_40px_-10px_rgba(253,176,192,0.4)]" : "bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed"}`}>
                    {isPasswordValid && <motion.div animate={{ x: ["-100%", "300%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 w-[40%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg]" />}
                    {loading ? <span className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin"></span> : <>Daftar VIP Sekarang <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </motion.div>
              </form>

              {/* SOCIAL LOGIN */}
              <motion.div variants={itemVariants} className="pt-10">
                <div className="flex items-center gap-6 mb-8">
                  <div className="h-px bg-white/5 flex-1" /><span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] whitespace-nowrap">Otentikasi Instan</span><div className="h-px bg-white/5 flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-zinc-950 text-white font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 group shadow-lg">
                    <svg className="w-5 h-5 group-hover:rotate-[360deg] transition-transform duration-700" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Google
                  </button>
                  <button onClick={() => signIn("facebook", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#1877F2] hover:border-[#1877F2] text-white font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 group shadow-lg">
                    <svg className="w-5 h-5 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between pt-10 mt-10 border-t border-white/5">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sudah memiliki akses? <Link href="/auth/login" className="text-white hover:text-sakura transition-all underline underline-offset-4">Masuk Elit</Link></p>
                <Link href="/auth/forgot-password" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-white transition-all mt-4 sm:mt-0 flex items-center gap-2"><PremiumLock /> Lupa Sandi?</Link>
              </motion.div>
              
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}