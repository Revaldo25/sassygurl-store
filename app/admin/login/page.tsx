"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        // Jika sukses, arahkan ke Brankas Utama (Dashboard Admin)
        router.push("/admin");
        router.refresh(); // Refresh halaman agar middleware mengenali tiket baru
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: '20px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔐</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>Admin <span style={{ color: 'var(--primary)' }}>SassyGurl</span></h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Masukkan kredensial untuk mengakses brankas.</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid #ef4444' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Username</label>
            <input 
              type="text" 
              required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }} 
              placeholder="Masukkan Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              required
              style={{ width: '100%', padding: '14px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 800, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', transition: '0.3s' }}
          >
            {isLoading ? 'MEMVERIFIKASI...' : 'MASUK BRANKAS'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Hanya untuk Owner & Staff yang berwenang.
        </p>
      </div>
    </div>
  );
}