"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Flame, Play, Square, Clock } from "lucide-react";
import { getFlashSaleConfig, saveFlashSaleConfig, forceTriggerFlashSale } from "@/app/actions/flashsale";

type FlashSaleConfig = {
  isActive: boolean;
  forceTrigger: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  discountPercent: number;
  gameIds: string[];
};

export default function FlashSaleManager({ games }: { games: any[] }) {
  const [config, setConfig] = useState<FlashSaleConfig>({
    isActive: false,
    forceTrigger: false,
    startHour: 12,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
    discountPercent: 10,
    gameIds: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await getFlashSaleConfig();
      if (res.success && res.data) {
        setConfig({
          isActive: res.data.isActive ?? false,
          forceTrigger: res.data.forceTrigger ?? false,
          startHour: res.data.startHour ?? 12,
          startMinute: res.data.startMinute ?? 0,
          endHour: res.data.endHour ?? 14,
          endMinute: res.data.endMinute ?? 0,
          discountPercent: res.data.discountPercent ?? 10,
          gameIds: res.data.gameIds || []
        });
      }
    } catch (e) {
      toast.error("Gagal mengambil konfigurasi Flash Sale");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveFlashSaleConfig(config);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error("Gagal menyimpan konfigurasi");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGame = (id: string) => {
    setConfig(prev => ({
      ...prev,
      gameIds: prev.gameIds.includes(id) 
        ? prev.gameIds.filter(g => g !== id)
        : [...prev.gameIds, id]
    }));
  };

  if (isLoading) return <div className="p-8 text-center text-zinc-400 font-bold animate-pulse">Memuat Konfigurasi Mesin...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
            <Flame className="h-5 w-5 text-status-warning" /> 
            Manajemen Flash Sale (Gamification)
          </h2>
          <p className="text-xs font-bold text-zinc-400 mt-2">Mesin waktu otomatis untuk mengobrak-abrik harga dan menciptakan badai FOMO.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-status-warning px-6 py-3 text-sm font-black text-black transition hover:bg-status-warning/80 disabled:opacity-50"
        >
          <Save size={16} /> {isSaving ? "MENYIMPAN..." : "SIMPAN KONFIGURASI"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: STATUS & TRIGGER */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-status-warning/20">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Status Mesin</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-black/40 border border-white/5 hover:border-status-warning/50 transition">
                <div>
                  <span className="text-sm font-bold text-white block">Jadwal Otomatis</span>
                  <span className="text-xs text-zinc-500">Aktifkan mesin Background Service</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.isActive ? 'bg-status-success' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${config.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                {/* Hidden input to handle click properly */}
                <input type="checkbox" className="hidden" checked={config.isActive} onChange={(e) => setConfig({...config, isActive: e.target.checked})} />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 hover:bg-status-warning/20 transition">
                <div>
                  <span className="text-sm font-bold text-status-warning flex items-center gap-2"><Play size={14} fill="currentColor"/> Paksa Mulai Sekarang (Hybrid)</span>
                  <span className="text-xs text-status-warning/70">Abaikan jadwal, nyalakan Flash Sale seketika!</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.forceTrigger ? 'bg-status-warning' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-black rounded-full transition-transform ${config.forceTrigger ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" className="hidden" checked={config.forceTrigger} onChange={(e) => setConfig({...config, forceTrigger: e.target.checked})} />
              </label>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2"><Clock size={16}/> Pengaturan Waktu (WIB)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Jam Mulai</label>
                <div className="flex gap-2">
                  <input type="number" min="0" max="23" value={config.startHour} onChange={(e) => setConfig({...config, startHour: Number(e.target.value)})} className="w-1/2 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-center font-bold outline-none focus:border-status-warning" />
                  <span className="text-white text-xl font-bold flex items-center">:</span>
                  <input type="number" min="0" max="59" value={config.startMinute} onChange={(e) => setConfig({...config, startMinute: Number(e.target.value)})} className="w-1/2 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-center font-bold outline-none focus:border-status-warning" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Jam Selesai</label>
                <div className="flex gap-2">
                  <input type="number" min="0" max="23" value={config.endHour} onChange={(e) => setConfig({...config, endHour: Number(e.target.value)})} className="w-1/2 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-center font-bold outline-none focus:border-status-warning" />
                  <span className="text-white text-xl font-bold flex items-center">:</span>
                  <input type="number" min="0" max="59" value={config.endMinute} onChange={(e) => setConfig({...config, endMinute: Number(e.target.value)})} className="w-1/2 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-center font-bold outline-none focus:border-status-warning" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Diskon Harga Jual (%)</label>
                <div className="relative">
                  <input type="number" min="1" max="99" value={config.discountPercent} onChange={(e) => setConfig({...config, discountPercent: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-bold outline-none focus:border-status-warning" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: TARGET GAMES */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[600px]">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Target Game</h3>
          <p className="text-xs text-zinc-400 mb-4">Pilih game mana saja yang akan ikut terbakar dalam Flash Sale ini.</p>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {games.map(g => (
              <label key={g.id} className={`flex items-center gap-4 p-3 rounded-xl border transition cursor-pointer ${config.gameIds.includes(g.id) ? 'bg-status-warning/10 border-status-warning/50' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                <input 
                  type="checkbox" 
                  checked={config.gameIds.includes(g.id)} 
                  onChange={() => toggleGame(g.id)}
                  className="w-5 h-5 rounded border-zinc-700 text-status-warning focus:ring-status-warning bg-black"
                />
                <img src={g.thumbnail || '/placeholder.png'} alt={g.name} className="w-10 h-10 rounded-lg object-cover" />
                <span className={`font-bold ${config.gameIds.includes(g.id) ? 'text-status-warning' : 'text-white'}`}>{g.name}</span>
              </label>
            ))}
            {games.length === 0 && (
              <div className="p-8 text-center text-zinc-500 font-bold border border-dashed border-white/10 rounded-xl">
                Tidak ada game di katalog.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
