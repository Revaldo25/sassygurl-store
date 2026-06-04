"use client";
import { useState, useEffect } from "react";
import { Activity, Database, Server, RefreshCw, ShieldAlert, AlertTriangle, Clock } from "lucide-react";

export default function OpsStatusView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOpsStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ops/status");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError("");
      } else {
        setError(json.message || "Failed to fetch ops status.");
      }
    } catch (err: any) {
      setError(err.message || "Network error fetching ops status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsStatus();
  }, []);

  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse font-mono text-sm">PROBING OPERATIONAL STATE...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-mono text-sm border border-red-500/20 bg-red-500/5 rounded-2xl">ERROR: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
          <Activity className="h-5 w-5 text-sakura" /> System Diagnostics
        </h2>
        <button onClick={fetchOpsStatus} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* DB Connection */}
        <div className={`rounded-2xl border p-5 ${data.databaseConnected ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Database className="h-3 w-3" /> Database
          </p>
          <p className="text-xl font-black">{data.databaseConnected ? "CONNECTED" : "DISCONNECTED"}</p>
        </div>

        {/* Redis Connection */}
        <div className={`rounded-2xl border p-5 ${data.redisConnected ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Server className="h-3 w-3" /> Redis Cache
          </p>
          <p className="text-xl font-black">{data.redisConnected ? "CONNECTED" : "DISCONNECTED"}</p>
        </div>

        {/* Pending Review Queue */}
        <div className={`rounded-2xl border p-5 ${data.pendingReviewQueueCount > 0 ? "border-amber-500/20 bg-amber-500/5 text-amber-400" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"}`}>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <ShieldAlert className="h-3 w-3" /> Review Queue
          </p>
          <p className="text-xl font-black">{data.pendingReviewQueueCount} Products</p>
        </div>

        {/* Refund Queue */}
        <div className={`rounded-2xl border p-5 ${data.refundQueueCount > 0 ? "border-red-500/20 bg-red-500/5 text-red-400" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"}`}>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <AlertTriangle className="h-3 w-3" /> Refund Queue
          </p>
          <p className="text-xl font-black">{data.refundQueueCount} Pending</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 backdrop-blur-md font-mono text-xs">
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Clock className="h-3 w-3" /> Timestamps & Metrics
          </h3>
          <div className="space-y-3 text-zinc-300">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>System Uptime:</span>
              <span className="text-white font-bold">{data.systemUptime}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>Last DB Backup:</span>
              <span className={data.lastBackupTimestamp === "N/A" ? "text-red-400 font-bold" : "text-white font-bold"}>{data.lastBackupTimestamp}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>Last Catalog Sync:</span>
              <span className={data.lastCatalogSync === "N/A" ? "text-red-400 font-bold" : "text-white font-bold"}>{data.lastCatalogSync}</span>
            </div>
            <div className="flex justify-between">
              <span>Notification Failures (24h):</span>
              <span className={(data.recentNotificationFailures === "N/A" || parseInt(data.recentNotificationFailures) > 0) ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{data.recentNotificationFailures}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 backdrop-blur-md font-mono text-xs">
          <h3 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Provider Health</h3>
          <div className="space-y-3">
            {data.providers && data.providers.length > 0 ? (
              data.providers.map((p: any) => (
                <div key={p.name} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-300">{p.name}</span>
                  <div className="text-right">
                    <span className={`block font-bold ${p.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>{p.status}</span>
                    <span className="text-[10px] text-zinc-500">{p.latencyMs}ms latency</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 italic">No provider health data available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
