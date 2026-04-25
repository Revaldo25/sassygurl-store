"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound, Globe, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginElitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "", password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        throw new Error("Email atau password salah.");
      }

      router.push("/dashboard");
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const inputBaseClass = "w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm font-semibold text-white focus:border-sakura focus:ring-4 focus:ring-sakura/10 outline-none transition-all duration-300 placeholder:text-zinc-600 hover:border-white/20 shadow-inner truncate [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#09090b] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:transition-none";

  return (
    <div className="h-screen flex bg-zinc-950 font-sans selection:bg-sakura selection:text-zinc-900 overflow-hidden">
      
      {/* ================= LEFT PANEL (VISUAL ACCESS) ================= */}
      <div className="hidden lg:flex w-5/12 bg-zinc-950 relative flex-col justify-between p-12 border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-white tracking-tighter">
            SASSYGURL<span className="text-sakura">.</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Globe className="w-4 h-4 text-sakura" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">Global Secure Node</span>
          </div>
        </div>

        {/* Center Visual: Holographic Key Access */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-sakura/20 blur-[100px] rounded-full animate-pulse"></div>
            
            {/* Floating Rings */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-white/5 rounded-full" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-8 border border-white/10 rounded-full border-dashed" />
            
            {/* Main Icon Core */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-32 h-32 bg-zinc-900 border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            >
              <KeyRound className="w-12 h-12 text-sakura drop-shadow-[0_0_15px_rgba(253,176,192,0.6)]" />
            </motion.div>
          </div>

          <div className="mt-12 text-center space-y-4">
            <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tight">
              Selamat Datang <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sakura to-brand-cyan">Kembali, Sultan.</span>
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">Otentikasi Berlapis AES-256</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          <span>© 2026 SassyGurlStore</span>
        </div>
      </div>

      {/* ================= RIGHT PANEL (LOGIN FORM) ================= */}
      <div className="w-full lg:w-7/12 h-screen overflow-y-auto no-scrollbar relative bg-[url('/noise.png')] bg-repeat opacity-95">
        
        <div className="fixed top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] bg-sakura/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="min-h-full flex flex-col justify-center p-4 py-12 sm:p-12 relative z-10">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="w-full max-w-[500px] mx-auto">
            <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              
              <motion.div variants={itemVariants} className="lg:hidden text-center mb-10">
                <Link href="/" className="text-3xl font-black text-white tracking-tighter">
                  SASSYGURL<span className="text-sakura">.</span>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-10">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">Masuk Akun</h2>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed">Silakan masukkan kredensial Anda untuk mengakses Dashboard VIP.</p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-bold uppercase tracking-wide">{errorMsg}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  {/* EMAIL */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Email Aktif</label>
                    <div className="group relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 group-focus-within:text-sakura transition-colors z-10" />
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="alamat@email.com" className={inputBaseClass} />
                    </div>
                  </motion.div>

                  {/* PASSWORD */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                      <Link href="/auth/forgot-password" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Lupa Password?</Link>
                    </div>
                    <div className="group relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-500 group-focus-within:text-sakura transition-colors z-10" />
                      <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="Masukkan kata sandi" className={`${inputBaseClass} pr-14`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="pt-4">
                  <button type="submit" disabled={loading}
                    className="w-full py-5 rounded-2xl bg-white text-zinc-950 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 active:scale-[0.98] hover:bg-sakura hover:text-white hover:shadow-[0_0_30px_rgba(253,176,192,0.4)] disabled:opacity-50 group"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                      <>Masuk Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </motion.div>
              </form>

              {/* SOCIAL LOGIN */}
              <motion.div variants={itemVariants} className="pt-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-white/5 flex-1" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Atau Akses Cepat</span>
                  <div className="h-px bg-white/5 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => signIn("google")} className="flex items-center justify-center gap-3 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-zinc-950 text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 group">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Google
                  </button>
                  <button onClick={() => signIn("facebook")} className="flex items-center justify-center gap-3 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-[#1877F2] hover:border-[#1877F2] text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 group">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-8 mt-8 border-t border-white/5 text-center">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Baru di SassyGurl? <Link href="/auth/register" className="text-white hover:text-sakura transition-colors">Buat Akun VIP</Link>
                </p>
              </motion.div>
              
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}