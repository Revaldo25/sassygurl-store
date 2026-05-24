"use client";

import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type PublicTransaction = {
  id: string;
  maskedTarget: string;
  gameName: string;
  productName: string;
  timestamp: string;
};

export default function LiveTransactionFeed({ initialData }: { initialData: PublicTransaction[] }) {
  const [transactions, setTransactions] = useState<PublicTransaction[]>(initialData);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let active = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");

    // 1. Initialize connection if not already created
    if (!connectionRef.current) {
      connectionRef.current = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hubs/notifications`)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();
    }

    const connection = connectionRef.current;

    // 2. Set up incoming message handler
    const handler = (data: any) => {
      if (!active) return;
      setTransactions((prev) => {
        const newTx = {
          id: Math.random().toString(),
          maskedTarget: data.maskedTarget,
          gameName: data.gameName,
          productName: data.productName,
          timestamp: new Date(data.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
        };
        // Deduplicate locally to avoid visual anomalies during double mounts or concurrent feeds
        if (prev.some(t => t.maskedTarget === newTx.maskedTarget && t.productName === newTx.productName)) {
          return prev;
        }
        return [newTx, ...prev].slice(0, 10);
      });
    };

    connection.on("PublicTransactionUpdated", handler);

    // 3. Start connection safely and store the start promise
    let startPromise: Promise<void> | null = null;
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      console.log("SignalR: Starting connection...");
      startPromise = connection.start()
        .then(() => {
          if (active) {
            console.log("SignalR: Connected successfully!");
          }
        })
        .catch((err) => {
          console.error("SignalR Connection Start failed:", err);
        });
    }

    // 4. Safe Cleanup
    return () => {
      active = false;
      
      // Unsubscribe immediately to stop state updates
      connection.off("PublicTransactionUpdated", handler);

      const stopConnection = async () => {
        // Wait for connection to finish negotiation/start before attempting stop
        if (startPromise) {
          try {
            await startPromise;
          } catch {
            // Ignore startup failures in cleanup
          }
        }

        // Only stop if the connection is still active or in connecting/reconnecting states
        if (connection.state !== signalR.HubConnectionState.Disconnected) {
          try {
            await connection.stop();
            console.log("SignalR: Stopped connection safely.");
          } catch (err) {
            console.error("SignalR: Error stopping connection:", err);
          }
        }

        // Nullify connectionRef ONLY if it still points to this exact connection instance
        if (connectionRef.current === connection) {
          connectionRef.current = null;
        }
      };

      stopConnection();
    };
  }, []);

  return (
    <div className="rounded-[2rem] border border-white/5 bg-zinc-900/30 p-6 backdrop-blur-3xl">
      <p className="text-[10px] font-bold tracking-[0.4em] text-sakura/75">LIVE TRANSACTIONS</p>
      <h3 className="mt-2 text-2xl font-black">Bukti transaksi terasa hidup</h3>
      <div className="mt-6 grid gap-3 overflow-hidden">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-950/60 px-5 py-4 transition hover:border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{tx.maskedTarget} <span className="font-normal text-white/70">berjaya membeli</span></p>
                  <p className="text-xs text-sakura font-semibold">{tx.productName} • {tx.gameName}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-emerald-400/80">
                {tx.timestamp}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {transactions.length === 0 && (
          <p className="text-sm text-white/40 text-center py-4">Menunggu transaksi baru...</p>
        )}
      </div>
    </div>
  );
}
