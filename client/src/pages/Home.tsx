import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          >
            SassyGurl
          </motion.div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-white/80 text-sm">
                  Welcome, <span className="font-semibold">{user.name}</span>
                </span>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Premium Game Top-Up Platform
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Experience the fastest and most reliable way to top-up your favorite games with SassyGurl. 
            Secure payments, instant delivery, and exclusive rewards.
          </p>
        </motion.div>

        {/* Payment Method Selector Demo */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Pilih Metode Pembayaran
            </h2>
            <PaymentMethodSelector
              productPrice={100000}
              productName="Mobile Legends - 500 Diamonds"
            />
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {[
            {
              title: "Real-Time Status",
              description: "Live provider status updates without page refresh",
              icon: "⚡",
            },
            {
              title: "SassyPoints Rewards",
              description: "Earn 100 points per Rp 10,000 spent",
              icon: "🎁",
            },
            {
              title: "Instant Delivery",
              description: "Game credits delivered within seconds",
              icon: "🚀",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400/40 transition-colors"
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
