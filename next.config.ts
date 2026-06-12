import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add Cloudflare and ngrok tunnel host to allow Dev Server requests
  allowedDevOrigins: [
    "reviewing-captain-cream-subscriptions.trycloudflare.com",
    "sassygurlvip.loca.lt",
    "unpresentative-apolonia-otherwise.ngrok-free.dev"
  ],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: isProd ? 3600 : 60,
    remotePatterns: [
      // Cloudinary (storage gambar produk)
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      // Google user avatars (social login)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Facebook user avatars (social login)
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
  },

  experimental: {
    optimizeCss: true,
  },

  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    // ngrok-skip-browser-warning HANYA untuk development lokal
    if (!isProd) {
      securityHeaders.push({ key: "ngrok-skip-browser-warning", value: "true" });
    }

    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:5009/api/:path*",
      },
      {
        source: "/hubs/:path*",
        destination: "http://localhost:5009/hubs/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:5009/uploads/:path*",
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/cek-pesanan",
        destination: "/track",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
