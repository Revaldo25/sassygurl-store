import { useState, useTransition, useEffect } from "react";
import { getSystemSettingsAction, updateSystemSettingAction } from "@/app/actions/dashboard";
import { Settings, Save, AlertCircle } from "lucide-react";

export default function SettingsTab() {
  const [settings, setSettings] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const fetchSettings = () => {
    startTransition(async () => {
      const data = await getSystemSettingsAction();
      setSettings(data);
      
      // Initialize local values for editing
      const initial: Record<string, string> = {};
      data.forEach(s => { initial[s.key] = s.value; });
      setLocalValues(initial);
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = (key: string) => {
    const val = localValues[key];
    startTransition(async () => {
      await updateSystemSettingAction(key, val);
      fetchSettings();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-widest text-white">
            <Settings className="h-6 w-6 text-sakura" /> Konfigurasi Sistem
          </h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Pusat Pengaturan Inti SassyGurl
          </p>
        </div>
        <button 
          onClick={fetchSettings}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-zinc-800"
        >
          {isPending ? "Memuat..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => {
          let title = setting.key;
          let desc = setting.description;
          let icon = "⚙️";

          if (setting.key === "ActiveProvider") {
            title = "Jalur API Otomatis (Provider)";
            desc = "Menentukan jalur mana yang akan digunakan SassyGurl untuk memproses top-up game secara otomatis ketika pembeli sukses membayar. Anda dapat memindahkannya antara Digiflazz atau VIP Reseller kapan saja jika salah satu server sedang bermasalah.";
            icon = "📡";
          } else if (setting.key === "MaintenanceMode") {
            title = "Mode Pemeliharaan (Maintenance)";
            desc = "Jika dinyalakan, seluruh website tidak akan bisa melakukan transaksi. Gunakan ini hanya jika Anda sedang memperbaiki bug atau menambahkan game baru secara besar-besaran.";
            icon = "🚧";
          }

          return (
          <div key={setting.key} className="glass-panel p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-sakura/30 transition-all">
            <div className="flex-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">{icon} {title}</h3>
              <p className="text-sm text-zinc-400 mt-1 font-medium leading-relaxed max-w-3xl">{desc}</p>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-3">
                Diperbarui oleh <span className="text-sakura">{setting.updatedBy || "System"}</span> • {new Date(setting.updatedAt).toLocaleString("id-ID")}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {setting.key === "ActiveProvider" ? (
                <select 
                  value={localValues[setting.key] || ""}
                  onChange={(e) => setLocalValues({...localValues, [setting.key]: e.target.value})}
                  className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 min-w-[200px] text-white text-sm font-bold outline-none focus:border-sakura transition-colors appearance-none"
                >
                  <option value="Digiflazz">Digiflazz API</option>
                  <option value="VipReseller">VIP Reseller</option>
                </select>
              ) : setting.key === "MaintenanceMode" ? (
                <select 
                  value={localValues[setting.key] || ""}
                  onChange={(e) => setLocalValues({...localValues, [setting.key]: e.target.value})}
                  className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 min-w-[200px] text-white text-sm font-bold outline-none focus:border-sakura transition-colors appearance-none"
                >
                  <option value="false">Mati (Live)</option>
                  <option value="true">Nyala (Maintenance)</option>
                </select>
              ) : (
                <input 
                  type="text" 
                  value={localValues[setting.key] || ""}
                  onChange={(e) => setLocalValues({...localValues, [setting.key]: e.target.value})}
                  className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 w-full md:w-[250px] text-white text-sm font-bold outline-none focus:border-sakura transition-colors"
                />
              )}
              
              <button 
                onClick={() => handleSave(setting.key)}
                disabled={isPending || localValues[setting.key] === setting.value}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  localValues[setting.key] !== setting.value
                    ? "bg-sakura text-zinc-950 hover:scale-105 shadow-[0_0_15px_rgba(253,176,192,0.3)]"
                    : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                }`}
                title="Simpan Perubahan"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
        )})}

        {settings.length === 0 && (
          <div className="glass-panel p-12 text-center flex flex-col items-center justify-center rounded-[2rem] border-dashed">
            <AlertCircle className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Belum Ada Pengaturan Sistem</p>
          </div>
        )}
      </div>
    </div>
  );
}
