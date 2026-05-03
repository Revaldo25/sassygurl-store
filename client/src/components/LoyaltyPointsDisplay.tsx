import { motion } from "framer-motion";
import { Gift, TrendingUp, History } from "lucide-react";
import { useLoyaltyStore } from "@/stores/loyaltyStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LoyaltyPointsDisplay() {
  const { sassyPointsBalance, history } = useLoyaltyStore();

  const recentTransactions = history.slice(0, 5);
  const totalEarned = history
    .filter((t) => t.transactionType === "EARN")
    .reduce((sum, t) => sum + t.pointsAmount, 0);
  const totalRedeemed = history
    .filter((t) => t.transactionType === "REDEEM")
    .reduce((sum, t) => sum + t.pointsAmount, 0);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Balance Card */}
      <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-400/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">SassyPoints Balance</p>
              <motion.p
                className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {sassyPointsBalance.toLocaleString("id-ID")}
              </motion.p>
              <p className="text-xs text-white/50 mt-2">
                ≈ Rp {(sassyPointsBalance * 100).toLocaleString("id-ID")} discount
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Gift className="w-12 h-12 text-indigo-400" />
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-xs text-white/60">Total Earned</p>
            </div>
            <p className="text-xl font-bold text-green-300">
              {totalEarned.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-orange-400" />
              <p className="text-xs text-white/60">Total Redeemed</p>
            </div>
            <p className="text-xl font-bold text-orange-300">
              {totalRedeemed.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTransactions.map((tx, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex-1">
                    <p className="text-xs text-white/80">{tx.description}</p>
                    <p className="text-xs text-white/40">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <Badge
                    className={
                      tx.transactionType === "EARN"
                        ? "bg-green-500/20 text-green-300 border-green-400/30"
                        : "bg-orange-500/20 text-orange-300 border-orange-400/30"
                    }
                  >
                    {tx.transactionType === "EARN" ? "+" : "-"}
                    {tx.pointsAmount}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redeem Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          disabled={sassyPointsBalance === 0}
        >
          Redeem Points
        </Button>
      </motion.div>
    </motion.div>
  );
}
