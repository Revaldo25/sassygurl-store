"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerServiceWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col space-y-3"
          >
            <a
              href="https://wa.me/6281234567890" // Replace with actual WA number
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 bg-green-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-600 transition-colors"
            >
              <span className="font-semibold text-sm">WhatsApp CS</span>
              <FaWhatsapp className="w-5 h-5" />
            </a>
            
            <a
              href="https://t.me/SassyGurlStoreBot" // Replace with actual Telegram Bot username
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-3 bg-blue-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            >
              <span className="font-semibold text-sm">Telegram Bot</span>
              <FaTelegramPlane className="w-5 h-5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-pink-600 hover:bg-pink-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
          </span>
        )}
      </button>
    </div>
  );
}
