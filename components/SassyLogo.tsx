"use client";

import { motion } from "framer-motion";

type Props = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizes = {
  sm: { icon: 28, text: "text-xs" },
  md: { icon: 36, text: "text-sm" },
  lg: { icon: 48, text: "text-lg" },
};

export default function SassyLogo({ size = "md", showText = true, className = "" }: Props) {
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Mark */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative shrink-0"
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(253,176,192,0.35)]"
        >
          {/* Background diamond shape */}
          <defs>
            <linearGradient id="logo-grad-gold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FDB0C0" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
            <linearGradient id="logo-grad-inner" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDB0C0" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Outer diamond */}
          <motion.path
            d="M24 2L44 24L24 46L4 24L24 2Z"
            stroke="url(#logo-grad-gold)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Inner S letterform */}
          <motion.path
            d="M18 16C18 14.5 19.5 13 22 13H26C28.5 13 30 14.5 30 16C30 18 28 19 26 19.5L22 20.5C20 21 18 22 18 24.5V26C18 26 18 28 18 29C18 31 19.5 33 22 33.5C22 33.5 24 34 26 34C28.5 34 30 32.5 30 31"
            stroke="url(#logo-grad-inner)"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
          />

          {/* Sparkle dots */}
          <motion.circle
            cx="14" cy="10" r="1.2"
            fill="#F59E0B"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="36" cy="38" r="1"
            fill="#22D3EE"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8, ease: "easeInOut" }}
          />
          <motion.circle
            cx="38" cy="14" r="0.8"
            fill="#FDB0C0"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2, ease: "easeInOut" }}
          />
        </svg>

        {/* Shimmer overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </motion.div>

      {/* Text */}
      {showText && (
        <div className="leading-tight">
          <p className={`font-black tracking-[0.15em] logo-shimmer ${s.text}`}>
            SASSYGURL
          </p>
          <p className="text-[9px] font-semibold tracking-[0.35em] text-white/50">
            STORE ULTRA
          </p>
        </div>
      )}
    </div>
  );
}
