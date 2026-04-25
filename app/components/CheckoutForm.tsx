"use client";
import { useState } from "react";

export default function CheckoutForm({ products }: { products: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: "", zoneId: "", wa: "" });
  const [method, setMethod] = useState("qris");
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedId);

  const handleOrder = async () => {
    if (!form.userId || !selectedId || !form.wa) return alert("Lengkapi data bosku!");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ ...form, productId: selectedId, paymentMethod: method }),
      });
      const data = await res.json();

      if (data.success) {
        const text = `Halo Admin SassyGurlStore!\n\nOrder ID: ${data.orderId}\nProduk: ${selectedProduct.name}\nID: ${form.userId} (${form.zoneId})\nVia: ${method.toUpperCase()}`;
        window.open(`https://wa.me/628123456789?text=${encodeURIComponent(text)}`);
      }
    } catch (e) {
      alert("Error koneksi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-grid">
      <div>
        <div className="card-section">
          <div className="step-num">1</div>
          <h2 className="card-title">Data Akun</h2>
          <div className="input-flex">
            <input className="input-field" placeholder="User ID" onChange={e => setForm({...form, userId: e.target.value})} />
            <input className="input-field" placeholder="Zone" style={{maxWidth: '90px'}} onChange={e => setForm({...form, zoneId: e.target.value})} />
          </div>
          <p style={{fontSize: '0.7rem', color: '#94a3b8'}}>Contoh: 12345678 (1234)</p>
        </div>

        <div className="card-section">
          <div className="step-num">3</div>
          <h2 className="card-title">Pembayaran</h2>
          {['qris', 'dana', 'gopay'].map(m => (
            <div key={m} className={`method-item ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>
              <span style={{fontWeight: 700}}>{m.toUpperCase()}</span>
              <span style={{fontSize: '0.7rem', color: 'var(--primary)'}}>Otomatis</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="card-section">
          <div className="step-num">2</div>
          <h2 className="card-title">Pilih Nominal</h2>
          <div className="item-grid">
            {products.map((p) => (
              <button key={p.id} className={`item-box ${selectedId === p.id ? 'active' : ''}`} onClick={() => setSelectedId(p.id)}>
                <span className="item-name">{p.name}</span>
                <span className="item-price">Rp {p.price.toLocaleString('id-ID')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-section" style={{border: '2px solid var(--primary)'}}>
          <h2 className="card-title">Konfirmasi & Beli</h2>
          <input className="input-field" placeholder="Nomor WhatsApp (08...)" onChange={e => setForm({...form, wa: e.target.value})} />
          <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: '0.9rem'}}>Total:</span>
            <span style={{fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)'}}>
              Rp {selectedProduct ? selectedProduct.price.toLocaleString('id-ID') : '0'}
            </span>
          </div>
          <button className="btn-buy" onClick={handleOrder} disabled={loading || !selectedId}>
            {loading ? "MEMPROSES..." : "BELI SEKARANG"}
          </button>
        </div>
      </div>
    </div>
  );
}