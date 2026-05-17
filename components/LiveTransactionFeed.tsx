"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`)
      .withAutomaticReconnect()
      .build();

    connection.on("PublicTransactionUpdated", (data) => {
      setTransactions((prev) => {
        const newTx = {
          id: Math.random().toString(),
          maskedTarget: data.maskedTarget,
          gameName: data.gameName,
          productName: data.productName,
          timestamp: new Date(data.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
        };
        return [newTx, ...prev].slice(0, 10);
      });
    });

    connection.start().catch((err) => console.error("SignalR Connection Error:", err));

    return () => {
      connection.stop();
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
