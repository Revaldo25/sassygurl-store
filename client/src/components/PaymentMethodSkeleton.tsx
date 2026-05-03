import { motion } from "framer-motion";

export function PaymentMethodSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((category) => (
        <motion.div
          key={category}
          className="rounded-lg bg-white/5 border border-white/10 overflow-hidden"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          {/* Category Header Skeleton */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="h-4 w-32 bg-white/10 rounded" />
          </div>

          {/* Methods List Skeleton */}
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((item) => (
              <motion.div
                key={item}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Logo Skeleton */}
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0" />

                  {/* Text Skeleton */}
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-white/10 rounded" />
                    <div className="h-2 w-32 bg-white/10 rounded" />
                  </div>

                  {/* Status Skeleton */}
                  <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
