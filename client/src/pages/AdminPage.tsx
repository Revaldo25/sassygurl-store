import { useAuth } from "@/_core/hooks/useAuth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Check if user is admin
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold text-white mb-4">
            Akses Ditolak
          </h1>
          <p className="text-white/60 mb-8">
            Anda tidak memiliki izin untuk mengakses halaman admin.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Kembali ke Beranda
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-white/50">SassyGurl Store Management</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white">{user.name}</p>
            <p className="text-xs text-white/50">Administrator</p>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto">
        <AdminDashboard />
      </div>
    </motion.div>
  );
}
