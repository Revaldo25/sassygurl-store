import { motion } from "framer-motion";
import { useProviderStatus } from "@/hooks/useProviderStatus";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface ProviderStatusIndicatorProps {
  providerName: string;
  size?: "sm" | "md" | "lg";
}

export function ProviderStatusIndicator({
  providerName,
  size = "md",
}: ProviderStatusIndicatorProps) {
  const { getProviderStatus } = useProviderStatus();
  const status = getProviderStatus(providerName);

  if (!status) {
    return null;
  }

  const isOnline = status.isOnline;
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const iconClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Status Light */}
      <motion.div
        className={`${sizeClasses[size]} rounded-full ${
          isOnline ? "bg-green-500" : "bg-red-500"
        }`}
        animate={{
          boxShadow: isOnline
            ? [
                "0 0 5px rgba(34, 197, 94, 0.5)",
                "0 0 10px rgba(34, 197, 94, 0.7)",
                "0 0 5px rgba(34, 197, 94, 0.5)",
              ]
            : [
                "0 0 5px rgba(239, 68, 68, 0.5)",
                "0 0 10px rgba(239, 68, 68, 0.7)",
                "0 0 5px rgba(239, 68, 68, 0.5)",
              ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Status Text */}
      <span className={`text-xs font-medium ${isOnline ? "text-green-400" : "text-red-400"}`}>
        {isOnline ? "Online" : "Offline"}
      </span>

      {/* Status Icon */}
      {isOnline ? (
        <CheckCircle2 className={`${iconClasses[size]} text-green-400`} />
      ) : (
        <AlertCircle className={`${iconClasses[size]} text-red-400`} />
      )}
    </motion.div>
  );
}

/**
 * Compact provider status badge for product cards
 */
export function ProviderStatusBadge({ providerName }: { providerName: string }) {
  const { getProviderStatus } = useProviderStatus();
  const status = getProviderStatus(providerName);

  if (!status) {
    return null;
  }

  const isOnline = status.isOnline;

  return (
    <motion.div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline
          ? "bg-green-500/20 text-green-300 border border-green-400/30"
          : "bg-red-500/20 text-red-300 border border-red-400/30"
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400" : "bg-red-400"}`}
        animate={{
          scale: isOnline ? [1, 1.2, 1] : [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {isOnline ? "Online" : "Offline"}
    </motion.div>
  );
}
