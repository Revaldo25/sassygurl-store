'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { fetcher } from '@/lib/utils';
import { Activity, AlertTriangle, CheckCircle, Database, ServerCrash, Clock, ShieldAlert } from 'lucide-react';

export default function CatalogHealthClient() {
  const { data: session } = useSWR('/api/auth/session', fetcher);
  
  const { data, error, isLoading } = useSWR<{ success: boolean; data: any }>(
    session?.user?.role === 'SUPERADMIN' ? '/api/catalog/health' : null,
    fetcher,
    { refreshInterval: 15000 } // Poll every 15s
  );

  if (isLoading) return <div className="text-white text-center py-12">Loading Health Metrics...</div>;
  if (error) return <div className="text-red-500 text-center py-12">Failed to load health metrics.</div>;

  const metrics = data?.data || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Products */}
      <HealthCard 
        title="Total Products" 
        value={metrics.totalProducts} 
        icon={<Database className="h-5 w-5 text-blue-400" />} 
      />
      
      {/* Active Products */}
      <HealthCard 
        title="Active / Publishable" 
        value={metrics.activeProducts} 
        icon={<CheckCircle className="h-5 w-5 text-emerald-400" />} 
        trend={`${metrics.inactiveProducts} inactive`}
      />

      {/* Needs Review */}
      <HealthCard 
        title="Ambiguous (Needs Review)" 
        value={metrics.needsReviewProducts} 
        icon={<ShieldAlert className={`h-5 w-5 ${metrics.needsReviewProducts > 0 ? 'text-rose-500' : 'text-emerald-400'}`} />} 
        alert={metrics.needsReviewProducts > 0}
      />

      {/* Without Grouping */}
      <HealthCard 
        title="Missing Categories" 
        value={metrics.productsWithoutGrouping} 
        icon={<AlertTriangle className={`h-5 w-5 ${metrics.productsWithoutGrouping > 0 ? 'text-amber-500' : 'text-emerald-400'}`} />} 
        alert={metrics.productsWithoutGrouping > 0}
      />

      {/* Sync Status */}
      <HealthCard 
        title="Sync Status" 
        value={metrics.syncStatus} 
        icon={<Activity className="h-5 w-5 text-emerald-400" />} 
        trend={metrics.syncFailures > 0 ? `${metrics.syncFailures} recent failures` : "100% success rate"}
        alert={metrics.syncFailures > 0}
      />

      {/* Provider Latency */}
      <HealthCard 
        title="Avg Provider Latency" 
        value={metrics.providerLatency} 
        icon={<ServerCrash className="h-5 w-5 text-purple-400" />} 
      />

      {/* Last Sync */}
      <HealthCard 
        title="Last Sync Time" 
        value={new Date(metrics.lastSyncTime).toLocaleTimeString()} 
        icon={<Clock className="h-5 w-5 text-neutral-400" />} 
      />
    </div>
  );
}

function HealthCard({ title, value, icon, trend, alert }: { title: string, value: string | number, icon: React.ReactNode, trend?: string, alert?: boolean }) {
  return (
    <div className={`bg-neutral-900 border ${alert ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'} rounded-2xl p-5 flex flex-col justify-between`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-neutral-400">{title}</p>
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <h3 className={`text-3xl font-black ${alert ? 'text-rose-400' : 'text-white'}`}>{value}</h3>
        {trend && (
          <p className="text-xs text-neutral-500 mt-2">{trend}</p>
        )}
      </div>
    </div>
  );
}
