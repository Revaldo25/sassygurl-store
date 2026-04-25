"use client";

import { useState, useEffect, useTransition } from "react";
import { prisma } from "@/lib/prisma"; // Digunakan di Server Action nantinya

// --- STYLES & COMPONENTS ---
const AdminCard = ({ title, value, color }: any) => (
  <div style={{ background: '#161B22', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, minWidth: '200px' }}>
    <div style={{ fontSize: '12px', fontWeight: 800, color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 900, color: color || '#fff' }}>{value}</div>
  </div>
);

export default function MegaAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "games" | "products" | "promos">("overview");
  const [games, setGames] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ omzet: 0, profit: 0, trxCount: 0 });

  // Simulasi Ambil Data (Nanti ganti dengan Server Actions)
  useEffect(() => {
    // Logic fetching data dari DB SassyGurl
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0D1117', color: '#fff', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION (ENTERPRISE STYLE) */}
      <aside style={{ width: '280px', backgroundColor: '#0a0a0f', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '40px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '50px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900 }}>SGY <span style={{ color: '#ec4899' }}>ADMIN</span></h1>
          <p style={{ fontSize: '10px', color: '#475569', fontWeight: 800, letterSpacing: '2px', marginTop: '5px' }}>COMMAND CENTER V12</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'overview', label: '📊 Ringkasan', icon: '📈' },
            { id: 'games', label: '🎮 Kelola Game', icon: '🎯' },
            { id: 'products', label: '💎 Daftar Produk', icon: '💰' },
            { id: 'promos', label: '🔥 Promo & Diskon', icon: '🎁' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)}
              style={{ textAlign: 'left', padding: '14px 20px', borderRadius: '16px', border: 'none', background: activeTab === item.id ? 'rgba(236, 72, 153, 0.1)' : 'transparent', color: activeTab === item.id ? '#ec4899' : '#8b949e', fontWeight: 800, cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 900 }}>Dashboard Sultan</h2>
            <p style={{ color: '#8b949e' }}>Selamat datang kembali, Owner SassyGurlStore!</p>
          </div>
          <button style={{ background: '#ec4899', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>+ TAMBAH GAME BARU</button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <AdminCard title="Total Omzet" value="Rp 45.250.000" color="#fff" />
              <AdminCard title="Laba Bersih" value="Rp 8.420.000" color="#22c55e" />
              <AdminCard title="Transaksi Sukses" value="1.240" color="#ec4899" />
            </div>

            {/* LIVE TRANSACTIONS TABLE */}
            <div style={{ background: '#161B22', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
               <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 900 }}>Antrean Transaksi Terbaru</div>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#0a0a0f', color: '#8b949e', fontSize: '12px', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '20px' }}>INVOICE</th>
                      <th style={{ padding: '20px' }}>GAME</th>
                      <th style={{ padding: '20px' }}>NOMINAL</th>
                      <th style={{ padding: '20px' }}>STATUS</th>
                      <th style={{ padding: '20px' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '14px' }}>
                    {/* Map data transaksi dari DB */}
                    <tr>
                      <td style={{ padding: '20px', fontWeight: 800 }}>SGY-1234567</td>
                      <td style={{ padding: '20px' }}>Mobile Legends</td>
                      <td style={{ padding: '20px', color: '#ec4899', fontWeight: 800 }}>Rp 22.000</td>
                      <td style={{ padding: '20px' }}><span style={{ padding: '6px 12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '8px', fontSize: '10px', fontWeight: 900 }}>SUCCESS</span></td>
                      <td style={{ padding: '20px' }}><button style={{ background: '#050508', border: '1px solid #1e1e26', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>DETAIL</button></td>
                    </tr>
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div style={{ background: '#161B22', padding: '30px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h3 style={{ fontWeight: 900 }}>Daftar Harga & Stok</h3>
              <input type="text" placeholder="Cari produk..." style={{ background: '#0D1117', border: '1px solid #30363d', borderRadius: '12px', padding: '10px 20px', color: '#fff', outline: 'none' }} />
            </div>
            {/* Grid List Produk untuk diedit harganya secara massal */}
          </div>
        )}
      </main>
    </div>
  );
}