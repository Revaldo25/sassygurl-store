"use client";

import { useState, useTransition } from "react";
import { trackOrderAction } from "@/app/actions/track";

export default function TrackOrderPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    startTransition(async () => {
      const res = await trackOrderAction(query);
        if (res.success && res.data) {
        setResults(res.data); // Tambahkan pengecekan res.data
        setMessage("");
      } else {
        setResults([]);
        setMessage(res.message || "Data tidak ditemukan");
      }
    });
  };

  const getStatusColor = (status: string) => {
    if (status === "SUCCESS") return "#22c55e";
    if (status === "FAILED") return "#ef4444";
    return "#eab308"; // PENDING
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#fff', paddingTop: '120px', paddingBottom: '80px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* DEKORASI LIGHT ORB */}
      <div style={{ position: 'absolute', top: '0', right: '0', width: '300px', height: '300px', background: '#7c3aed', filter: 'blur(100px)', opacity: 0.1, zIndex: 0 }} />

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>Lacak <span style={{ color: '#ec4899' }}>Pesanan</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Masukkan Nomor Invoice atau WhatsApp Anda untuk melihat status transaksi.</p>
        </div>

        {/* SEARCH BOX GLASSMORPHISM */}
        <form onSubmit={handleTrack} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px', borderRadius: '24px', display: 'flex', gap: '8px', marginBottom: '40px', backdropFilter: 'blur(16px)' }}>
          <input 
            type="text" placeholder="INV-SGY-XXXXXXXX atau 0812..." value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '16px 20px', color: '#fff', fontSize: '15px', outline: 'none' }}
          />
          <button type="submit" disabled={isPending} style={{ background: '#ec4899', border: 'none', padding: '0 30px', borderRadius: '18px', color: '#fff', fontWeight: 800, cursor: 'pointer', transition: '0.3s' }}>
            {isPending ? 'MENCARI...' : 'TRACK'}
          </button>
        </form>

        {/* HASIL PENCARIAN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {message && <div style={{ textAlign: 'center', color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '15px', borderRadius: '16px' }}>{message}</div>}
          
          {results.map((trx) => (
            <div key={trx.id} style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              {/* INDIKATOR STATUS GLOWING */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: getStatusColor(trx.orderStatus) }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '4px', letterSpacing: '1px' }}>INVOICE ID</div>
                  <div style={{ fontSize: '16px', fontWeight: 900 }}>{trx.invoiceId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, padding: '6px 12px', borderRadius: '10px', backgroundColor: `${getStatusColor(trx.orderStatus)}20`, color: getStatusColor(trx.orderStatus), border: `1px solid ${getStatusColor(trx.orderStatus)}40` }}>
                    {trx.orderStatus}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 800, marginBottom: '4px' }}>PRODUK</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{trx.product.game.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{trx.product.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 800, marginBottom: '4px' }}>TARGET ID</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{trx.targetPlayerId}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#475569', fontSize: '12px' }}>{new Date(trx.createdAt).toLocaleString('id-ID')}</div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>Rp {Number(trx.amount).toLocaleString('id-ID')}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}