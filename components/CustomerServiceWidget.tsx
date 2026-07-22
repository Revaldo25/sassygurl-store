"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function CustomerServiceWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // WA: 082374623877 -> 6282374623877
  const waNumber = "6282374623877";
  const waLink = `https://wa.me/${waNumber}?text=Halo%20SassyGurl%20CS,%20saya%20butuh%20bantuan`;
  
  // Telegram Bot/Username (Dummy for now, waiting for user token)
  const tgLink = `https://t.me/SassyGurlSupport_Bot`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col space-y-3 mb-4"
          >
            {/* WhatsApp Option */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3 rounded-2xl shadow-2xl hover:bg-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="bg-[#25D366] p-2 rounded-full shadow-lg group-hover:shadow-[#25D366]/50">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.01 2.014c-5.464 0-9.897 4.435-9.897 9.897 0 1.745.455 3.447 1.319 4.945L2.01 21.99l5.281-1.385c1.455.82 3.109 1.252 4.809 1.252 5.466 0 9.898-4.435 9.898-9.897s-4.432-9.897-9.898-9.897z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16.536 15.226c-.256-.128-1.516-.748-1.75-.833-.234-.085-.404-.128-.574.128-.171.256-.66 .833-.809 1.004-.149.171-.298.192-.553.064-.256-.128-1.082-.4-2.062-1.275-.762-.68-1.275-1.521-1.424-1.777-.149-.256-.016-.395.112-.522.115-.115.256-.298.384-.447.128-.149.171-.256.256-.426.085-.171.042-.32-.021-.447-.064-.128-.574-1.385-.788-1.896-.208-.499-.421-.432-.574-.44-.149-.007-.32-.007-.49-.007-.171 0-.447.064-.682.32-.234.256-.895.874-.895 2.13 0 1.257.916 2.472 1.044 2.643.128.171 1.802 2.75 4.364 3.834 2.562 1.085 2.562.725 3.031.682.469-.043 1.516-.618 1.729-1.215.213-.597.213-1.108.149-1.215-.064-.107-.234-.171-.49-.298z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold tracking-wide">WhatsApp CS</span>
                <span className="text-white/60 text-xs">Balasan Kilat ⚡</span>
              </div>
            </a>

            {/* Telegram Option */}
            <a
              href={tgLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3 rounded-2xl shadow-2xl hover:bg-white/20 hover:scale-105 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="bg-[#0088cc] p-2 rounded-full shadow-lg group-hover:shadow-[#0088cc]/50">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.21 3.46-.49.33-.94.5-1.35.49-.45-.01-1.32-.26-1.96-.46-.79-.26-1.42-.39-1.36-.83.03-.22.34-.45.93-.69 3.64-1.58 6.06-2.63 7.27-3.13 3.46-1.43 4.18-1.68 4.65-1.69.1 0 .34.02.47.11.11.08.15.19.16.27-.01.04-.01.12-.02.21z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold tracking-wide">Telegram Bot</span>
                <span className="text-white/60 text-xs">Sistem Otomatis 🤖</span>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center p-4 rounded-full shadow-2xl transition-all duration-500 overflow-hidden group ${
          isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110"
        }`}
      >
        <div className="absolute inset-0 bg-white/20 group-hover:scale-150 transition-transform duration-700 rounded-full" />
        {isOpen ? (
          <X className="w-8 h-8 text-white relative z-10" />
        ) : (
          <MessageCircle className="w-8 h-8 text-white relative z-10 animate-pulse" />
        )}
        
        {/* Unread indicator */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full animate-bounce" />
        )}
      </button>
    </div>
  );
}
