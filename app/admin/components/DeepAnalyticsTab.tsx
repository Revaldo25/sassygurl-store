'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  ComposedChart, Area, Line, Legend 
} from 'recharts';
import { RefreshCw, Activity, ArrowRight, MousePointerClick, ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function DeepAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      // In real scenario we use adminApi, but here we can just fetch
      const token = localStorage.getItem('sassy_admin_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5031'}/api/adminreport/analytics-funnel?days=7`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const resData = await response.json();
      if (resData.success) {
        setData(resData);
      } else {
        throw new Error(resData.message || 'Error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-zinc-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
        <p>Memuat Deep Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 flex flex-col items-center">
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg">Coba Lagi</button>
      </div>
    );
  }

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  // Format heatmap for Recharts
  const heatmapData = daysOfWeek.map((day, idx) => {
    const dayData: any = { name: day };
    for (let h = 0; h < 24; h++) {
      dayData[`h${h}`] = data.heatmap?.find((x: any) => x.day === idx && x.hour === h)?.value || 0;
    }
    return dayData;
  });

  // Conversion Funnel Colors
  const funnelColors = ['#8b5cf6', '#ec4899', '#10b981'];
  const funnelIcons = [MousePointerClick, ShoppingCart, CheckCircle2];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Sales Funnel Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-pink-500" /> Conversion Funnel
            </h3>
            <p className="text-zinc-400 text-sm mt-1">Lacak perjalanan user dari kunjungan hingga pembelian sukses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.funnel?.map((item: any, i: number) => {
            const Icon = funnelIcons[i];
            const dropoff = i > 0 ? ((data.funnel[i].value / data.funnel[i-1].value) * 100).toFixed(1) : '100';
            
            return (
              <div key={item.name} className="relative">
                {i > 0 && (
                  <div className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700">
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                
                <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 hover:border-pink-500/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-4" style={{ color: funnelColors[i] }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-zinc-400 font-medium mb-2">{item.name}</h4>
                  <div className="text-3xl font-black text-white">{item.value.toLocaleString('id-ID')}</div>
                  
                  {i > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-700/50">
                      <div className="text-sm font-medium" style={{ color: funnelColors[i] }}>
                        {dropoff}% Konversi
                      </div>
                      <div className="text-xs text-zinc-500">dari tahap sebelumnya</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6">Heatmap Transaksi (7 Hari)</h3>
        <p className="text-zinc-400 text-sm mb-6">Waktu paling sibuk dalam seminggu berdasarkan transaksi sukses.</p>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatmapData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
              <YAxis stroke="#a1a1aa" tick={{fill: '#a1a1aa'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              <Legend />
              {/* Stack 24 hours into 4 periods for simpler view */}
              <Bar dataKey="h12" name="Siang (12:00)" stackId="a" fill="#f59e0b" />
              <Bar dataKey="h19" name="Malam (19:00)" stackId="a" fill="#ec4899" />
              <Bar dataKey="h21" name="Puncak (21:00)" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
