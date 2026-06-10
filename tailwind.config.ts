import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // THE CANVAS: Obsidian Black for depth and luxury
        obsidian: {
          DEFAULT: "#050508", // Absolute background
          surface: "#09090b", // Cards and elevated panels
          border: "rgba(255, 255, 255, 0.05)", // Glass borders
        },
        // THE SIGNATURE: SassyGurl's main identity. Used for primary CTAs and Brand Highlights.
        sakura: {
          DEFAULT: "#FDB0C0",
          hover: "#F89BAE",
          dim: "rgba(253, 176, 192, 0.1)",
          glow: "rgba(253, 176, 192, 0.25)",
        },
        // THE LUXURY: Secondary accent for VIP, Premium features, and deep gradients.
        royal: {
          DEFAULT: "#8B5CF6", // Violet
          dim: "rgba(139, 92, 246, 0.1)",
        },
        // THE STATUS: Functional colors that must never be used purely for decoration.
        status: {
          success: "#10B981", // Emerald (Online, Complete, Healthy)
          warning: "#F59E0B", // Amber (Pending, Caution, Degraded)
          danger: "#EF4444",  // Red (Error, Failed, Offline)
          info: "#3B82F6",    // Blue (Helper, Secondary actions)
        }
      },
      backgroundImage: {
        'sakura-glow': 'radial-gradient(circle at 50% 0%, rgba(253, 176, 192, 0.15), transparent 60%)',
        'royal-glow': 'radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.1), transparent 60%)',
        'glass-panel': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;