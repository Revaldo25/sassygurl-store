"use client";
import { useState, useEffect, useTransition } from "react";
import { Activity, Database, Server, RefreshCw, ShieldAlert, AlertTriangle, Clock, Terminal } from "lucide-react";
import { getOpsStatus } from "@/app/actions/dashboard";
import { motion, AnimatePresence } from "framer-motion";

export default function OpsStatusView() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchOpsStatus = () => {
    startTransition(async () => {
      try {
        const res = await getOpsStatus();
        if (res) {
          setData(res);
          setError("");
        } else {
          setError("Failed to fetch ops status.");
        }
      } catch (err: any) {
        setError(err.message || "Network error fetching ops status.");
      }
    });
  };

  useEffect(() => {
    fetchOpsStatus();
  }, []);

  if (!data && isPending) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Activity className="h-8 w-8 text-sakura/50" />
        </motion.div>
        <span className="ml-4 font-mono text-sm tracking-widest text-zinc-500 animate-pulse">PROBING OPERATIONAL STATE...</span>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 text-center text-status-danger font-mono text-sm border border-status-danger/20 bg-status-danger/5 rounded-[2rem]">
        <Terminal className="h-6 w-6 text-status-danger mx-auto mb-3" />
        ERROR: {error}
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between rounded-[2rem] border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl">
        <h2 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-white">
          <Activity className="h-5 w-5 text-sakura" /> System Diagnostics
        </h2>
        <button 
          onClick={fetchOpsStatus} 
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-sakura/10 border border-sakura/20 px-5 py-2.5 text-xs font-bold text-sakura transition hover:bg-sakura/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`} /> REFRESH
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* DB Connection */}
        <motion.div whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-md ${data.databaseConnected ? "border-status-success/20 bg-status-success/5 text-status-success shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-status-danger/20 bg-status-danger/5 text-status-danger"}`}>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <Database className="h-3.5 w-3.5" /> Database
          </p>
          <p className="text-2xl font-black tracking-tight">{data.databaseConnected ? "CONNECTED" : "DISCONNECTED"}</p>
        </motion.div>

        {/* Redis Connection */}
        <motion.div whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-md ${data.redisConnected ? "border-status-success/20 bg-status-success/5 text-status-success shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-status-danger/20 bg-status-danger/5 text-status-danger"}`}>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <Server className="h-3.5 w-3.5" /> Redis Cache
          </p>
          <p className="text-2xl font-black tracking-tight">{data.redisConnected ? "CONNECTED" : "DISCONNECTED"}</p>
        </motion.div>

        {/* Pending Review Queue */}
        <motion.div whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-md ${data.pendingReviewQueueCount > 0 ? "border-status-warning/20 bg-status-warning/5 text-status-warning shadow-[0_0_20px_rgba(245,158,11,0.05)]" : "border-status-success/20 bg-status-success/5 text-status-success"}`}>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <ShieldAlert className="h-3.5 w-3.5" /> Review Queue
          </p>
          <p className="text-2xl font-black tracking-tight">{data.pendingReviewQueueCount} Products</p>
        </motion.div>

        {/* Refund Queue */}
        <motion.div whileHover={{ y: -4 }} className={`rounded-[2rem] border p-6 backdrop-blur-md ${data.refundQueueCount > 0 ? "border-status-danger/20 bg-status-danger/5 text-status-danger shadow-[0_0_20px_rgba(239,68,68,0.05)]" : "border-status-success/20 bg-status-success/5 text-status-success"}`}>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <AlertTriangle className="h-3.5 w-3.5" /> Refund Queue
          </p>
          <p className="text-2xl font-black tracking-tight">{data.refundQueueCount} Pending</p>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-md font-mono text-xs">
          <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-sakura flex items-center gap-2">
            <Clock className="h-4 w-4" /> Timestamps & Metrics
          </h3>
          <div className="space-y-4 text-zinc-400">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span>System Uptime:</span>
              <span className="text-status-success font-bold bg-status-success/10 px-3 py-1 rounded-lg">{data.systemUptime}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span>Last DB Backup:</span>
              <span className={data.lastBackupTimestamp === "N/A" ? "text-status-danger font-bold" : "text-white font-bold"}>{data.lastBackupTimestamp}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span>Last Catalog Sync:</span>
              <span className={data.lastCatalogSync === "N/A" ? "text-status-danger font-bold" : "text-white font-bold"}>{data.lastCatalogSync}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Notification Failures (24h):</span>
              <span className={(data.recentNotificationFailures === "N/A" || parseInt(data.recentNotificationFailures) > 0) ? "text-status-danger font-bold" : "text-status-success font-bold"}>{data.recentNotificationFailures}</span>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-8 backdrop-blur-md font-mono text-xs">
          <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-sakura">Provider Health</h3>
          <div className="space-y-4">
            {data.providers && data.providers.length > 0 ? (
              data.providers.map((p: any) => (
                <div key={p.name} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-zinc-300 font-bold">{p.name}</span>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-lg font-bold mb-1 ${p.status === 'OK' ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'}`}>{p.status}</span>
                    <span className="block text-[10px] text-zinc-500 font-sans tracking-widest uppercase">{p.latencyMs}ms latency</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 italic p-4 text-center border border-dashed border-white/10 rounded-xl">No provider health data available.</div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
