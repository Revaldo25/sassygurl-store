"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { getCurrentMemberAction, logoutAction, processAuth, verifyOtpAction } from "@/app/actions/auth"; 

// --- PURE SVG ICONS ---
const Icons = {
  Email: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
  Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  Google: () => <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>,
  Facebook: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  Eye: (open: boolean) => open ? 
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> :
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
};

export default function MemberArea() {
  const [step, setStep] = useState<"auth" | "otp" | "dashboard">("auth");
  const [isLoginView, setIsLoginView] = useState(true);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [showPass, setShowPass] = useState(false);
  const [memberData, setMemberData] = useState<{name: string, id: string} | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isPending, startTransition] = useTransition(); 

  useEffect(() => {
    getCurrentMemberAction()
      .then((data) => {
        if (data.success && data.member) {
          setMemberData(data.member);
          setStep("dashboard");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (timer > 0) { const id = setInterval(() => setTimer(t => t - 1), 1000); return () => clearInterval(id); }
  }, [timer]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }, [otp]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    startTransition(async () => {
      if (step === "otp") {
        const identifier = authMethod === "email" ? form.email : form.phone;
        const res = await verifyOtpAction(identifier, otp.join(""));
        if (res.success) window.location.reload();
        else setMessage({ type: "error", text: res.message });
        return;
      }

      const actionType = isLoginView ? "login" : "register";
      const payload = { action: actionType, method: authMethod, ...form };
      const res = await processAuth(payload);

      if (res.success) {
        if (res.step === "verify_otp") {
          setStep("otp");
          setTimer(60);
          setMessage({ type: "success", text: res.message });
        } else {
          window.location.reload();
        }
      } else {
        setMessage({ type: "error", text: res.message });
      }
    });
  };

  if (step === "dashboard" && memberData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508', padding: '20px' }}>
        <div style={{ textAlign: 'center', background: '#0d0d14', padding: '50px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '440px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#22c55e' }}><Icons.User /></div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Halo, {memberData.name}!</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Akses VIP SassyGurlStore Terverifikasi</p>
          <button onClick={async () => { await logoutAction(); window.location.reload(); }}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}>LOGOUT AKUN</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050508', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>SGY <span style={{ color: '#ec4899' }}>MEMBER</span></h2>
          <p style={{ fontSize: '10px', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '8px' }}>Secure Authentication</p>
        </div>

        <div style={{ background: '#0d0d14', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
          
          {step === "auth" && (
            <div style={{ display: 'flex', background: '#050508', padding: '5px', borderRadius: '14px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button type="button" onClick={() => { setAuthMethod("email"); setMessage({type:"", text:""}) }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: authMethod === "email" ? '#ec4899' : 'transparent', color: '#fff', fontWeight: 800, fontSize: '11px', cursor: 'pointer', transition: '0.3s' }}>EMAIL</button>
              <button type="button" onClick={() => { setAuthMethod("phone"); setMessage({type:"", text:""}) }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: authMethod === "phone" ? '#ec4899' : 'transparent', color: '#fff', fontWeight: 800, fontSize: '11px', cursor: 'pointer', transition: '0.3s' }}>WHATSAPP</button>
            </div>
          )}

          {message.text && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: message.type === 'error' ? '#ef4444' : '#22c55e', marginBottom: '20px', textAlign: 'center', padding: '12px', borderRadius: '12px', background: message.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: '1px solid currentColor' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {step === "otp" ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>Masukkan 6 Digit Kode</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '30px' }}>
                  {otp.map((digit, idx) => (
                    <input 
                      key={idx} ref={el => { if (el) otpRefs.current[idx] = el; }} 
                      type="text" value={digit} maxLength={1}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onKeyDown={e => handleKeyDown(e, idx)}
                      style={{ width: '45px', height: '54px', boxSizing: 'border-box', background: '#050508', border: '1px solid #1e1e26', borderRadius: '12px', textAlign: 'center', color: '#fff', fontSize: '20px', fontWeight: 900, outline: 'none', transition: '0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = '#ec4899'} onBlur={(e) => e.target.style.borderColor = '#1e1e26'} 
                    />
                  ))}
                </div>
                {timer > 0 ? <p style={{fontSize:'12px', color:'#475569'}}>Kirim ulang dalam <b style={{color:'#fff'}}>{timer}s</b></p> : <button type="button" onClick={() => setTimer(60)} style={{background:'none', border:'none', color:'#ec4899', fontWeight:800, fontSize:'12px', cursor:'pointer'}}>KIRIM ULANG KODE</button>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!isLoginView && (
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}><Icons.User /></div>
                    <input required placeholder="Nama Lengkap Sultan" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', height: '52px', background: '#050508', border: '1px solid #1e1e26', borderRadius: '14px', padding: '0 48px', color: '#fff', fontSize: '14px', outline: 'none', transition: '0.2s' }} onFocus={(e) => e.target.style.borderColor = '#ec4899'} onBlur={(e) => e.target.style.borderColor = '#1e1e26'} />
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>{authMethod === "email" ? <Icons.Email /> : <Icons.Phone />}</div>
                  <input required placeholder={authMethod === "email" ? "Alamat Email" : "Nomor WhatsApp"} value={authMethod === "email" ? form.email : form.phone} onChange={(e) => authMethod === "email" ? setForm({...form, email: e.target.value}) : setForm({...form, phone: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', height: '52px', background: '#050508', border: '1px solid #1e1e26', borderRadius: '14px', padding: '0 48px', color: '#fff', fontSize: '14px', outline: 'none', transition: '0.2s' }} onFocus={(e) => e.target.style.borderColor = '#ec4899'} onBlur={(e) => e.target.style.borderColor = '#1e1e26'} />
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}><Icons.Lock /></div>
                  <input required type={showPass ? "text" : "password"} placeholder="Password Akun" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', height: '52px', background: '#050508', border: '1px solid #1e1e26', borderRadius: '14px', padding: '0 48px', color: '#fff', fontSize: '14px', outline: 'none', transition: '0.2s' }} onFocus={(e) => e.target.style.borderColor = '#ec4899'} onBlur={(e) => e.target.style.borderColor = '#1e1e26'} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#475569', cursor:'pointer' }}>{Icons.Eye(showPass)}</button>
                </div>
              </div>
            )}

            <button type="submit" disabled={isPending} style={{ width: '100%', height: '56px', background: 'linear-gradient(45deg, #ec4899, #8b5cf6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '24px', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.25)', transition: '0.3s', opacity: isPending ? 0.7 : 1 }}>
              {isPending ? 'MEMPROSES...' : (step === "otp" ? 'KONFIRMASI KODE' : (isLoginView ? 'MASUK KE AKUN' : 'GABUNG SEKARANG'))}
            </button>
          </form>

          {step === "auth" && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                <span style={{ padding: '0 15px', fontSize: '10px', color: '#475569', fontWeight: 800, letterSpacing: '1px' }}>ATAU</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button type="button" style={{ height: '48px', boxSizing: 'border-box', background: '#050508', border: '1px solid #1e1e26', borderRadius: '14px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s' }}><Icons.Google /> GOOGLE</button>
                <button type="button" style={{ height: '48px', boxSizing: 'border-box', background: '#050508', border: '1px solid #1e1e26', borderRadius: '14px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s' }}><Icons.Facebook /> FACEBOOK</button>
              </div>
              <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: '#475569' }}>
                {isLoginView ? "Belum punya akun?" : "Sudah jadi member?"} <span onClick={() => { setIsLoginView(!isLoginView); setMessage({type:"", text:""}); }} style={{ color: '#ec4899', fontWeight: 800, cursor: 'pointer' }}>{isLoginView ? "Daftar" : "Login"}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}