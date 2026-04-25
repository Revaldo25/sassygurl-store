import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          950: "#09090b", // Background Utama (Obsidian)
          900: "#18181b", // Card & Surface
          800: "#27272a", // Border & Input
        },
        sakura: {
          DEFAULT: "#FDB0C0", // Pink Sakura yang Soft & Mewah
          hover: "#F89BAE",
          dim: "rgba(253, 176, 192, 0.1)",
        },
      },
      backgroundImage: {
        'sakura-glow': 'radial-gradient(circle at 50% -20%, rgba(253, 176, 192, 0.15), transparent 70%)',
        'zinc-glass': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;