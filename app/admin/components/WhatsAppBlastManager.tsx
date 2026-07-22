"use client";

import { useState, useEffect } from "react";

import { toast } from "sonner";
export default function WhatsAppBlastManager() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ Total: 0, Pending: 0, Sent: 0, Failed: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Poll status every 5 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/notification/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch blast status", err);
    }
  };

  const handleSendBlast = async () => {
    if (!message.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }

    const isConfirmed = window.confirm("Anda yakin ingin mengirim pesan ini ke seluruh pengguna? Pesan akan masuk ke antrean dan dikirim bertahap.");

    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/notification/blast", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setMessage("");
        fetchStatus();
      } else {
        toast.error(data.message || "Gagal mengirim blast");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center">
          <p className="text-sm text-gray-400">Total Antrean (Sejarah)</p>
          <p className="text-3xl font-bold text-white">{status.Total}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-yellow-500/30 text-center">
          <p className="text-sm text-yellow-500">Mengantre (Pending)</p>
          <p className="text-3xl font-bold text-yellow-400">{status.Pending}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-green-500/30 text-center">
          <p className="text-sm text-green-500">Terkirim (Sent)</p>
          <p className="text-3xl font-bold text-green-400">{status.Sent}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-red-500/30 text-center">
          <p className="text-sm text-red-500">Gagal (Failed)</p>
          <p className="text-3xl font-bold text-red-400">{status.Failed}</p>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">📢 Buat Kampanye Blast Baru</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Isi Pesan WhatsApp
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Gunakan <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">&#123;Nama&#125;</code> untuk memanggil nama user secara dinamis.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[200px]"
            placeholder="Halo {Nama},&#10;&#10;Top up Diamond Mobile Legends sekarang sedang Flash Sale besar-besaran lho!&#10;&#10;Buruan cek di SassyGurl Store sebelum kehabisan."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSendBlast}
            disabled={isLoading || status.Pending > 0}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              isLoading || status.Pending > 0
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-primary text-black hover:bg-primary-hover shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]"
            }`}
          >
            {isLoading ? "Memproses..." : status.Pending > 0 ? "Menunggu Antrean Selesai" : "🚀 Kirim Pesan Massal"}
          </button>
        </div>
      </div>
    </div>
  );
}
