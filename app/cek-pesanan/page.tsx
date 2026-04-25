"use client";

import { useState } from "react";

export default function CekPesanan() {
  const [invoice, setInvoice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCek = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cek-pesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Gagal menghubungi server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // FUNGSI FORMAT TANGGAL CANTIK
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString)) + ' WIB';
  };

  return (
    <div className="container" style={{ minHeight: '80vh', paddingTop: '4rem', paddingBottom: '4rem' }}>
      
      <a href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem', fontSize: '0.9rem' }}>
        ← Kembali ke Halaman Utama
      </a>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Lacak <span style={{ color: 'var(--primary)' }}>Pesanan</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Masukkan nomor invoice Anda untuk melacak status top up secara real-time.
          </p>
        </div>

        {/* Form Pencarian */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <form onSubmit={handleCek} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="input-control" 
              placeholder="Contoh: SGY-123456" 
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              style={{ margin: 0, flex: 1 }}
              required
            />
            <button type="submit" className="btn-primary" style={{ margin: 0, padding: '0 2rem', whiteSpace: 'nowrap' }} disabled={isLoading}>
              {isLoading ? "MENCARI..." : "CARI"}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.85rem' }}>{error}</p>}
        </div>

        {/* Hasil Pencarian */}
        {result && (
          <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Detail Pesanan</h2>
              <span style={{ 
                background: result.orderStatus === 'SUCCESS' ? 'rgba(34, 197, 94, 0.1)' : result.orderStatus === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
                color: result.orderStatus === 'SUCCESS' ? '#22c55e' : result.orderStatus === 'FAILED' ? '#ef4444' : '#eab308', 
                padding: '5px 15px', 
                borderRadius: '20px', 
                fontWeight: 800, 
                fontSize: '0.8rem' 
              }}>
                {result.orderStatus}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>Nomor Invoice</p>
                <p style={{ fontWeight: 700 }}>{result.invoiceId}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>Waktu Pembelian</p>
                {/* INI BAGIAN YANG DIPERBAIKI */}
                <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatDate(result.createdAt)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>Produk</p>
                <p style={{ fontWeight: 700 }}>{result.product.name}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>Game</p>
                <p style={{ fontWeight: 700 }}>{result.product.category.name}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>ID Tujuan</p>
                <p style={{ fontWeight: 700 }}>{result.targetId} {result.targetZone ? `(${result.targetZone})` : ""}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-dim)', marginBottom: '5px' }}>Metode Pembayaran</p>
                <p style={{ fontWeight: 700 }}>{result.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Total Pembayaran</p>
              <p style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>
                Rp {result.priceSell.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}