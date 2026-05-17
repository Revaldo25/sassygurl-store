import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // Mengizinkan semua CDN eksternal (Press Kit)
    ],
    minimumCacheTTL: 60, // Cache gambar selama 60 detik untuk performa
  },
  experimental: {
    optimizeCss: true, // Auto-minify CSS
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "ngrok-skip-browser-warning",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;