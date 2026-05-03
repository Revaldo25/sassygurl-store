import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Transaction {
  id: string;
  orderId: string;
  productName: string;
  amount: number;
  paymentMethod: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  createdAt: Date;
  userId: number;
}

interface TransactionLogsProps {
  transactions?: Transaction[];
  isLoading?: boolean;
}

export function TransactionLogs({
  transactions = [],
  isLoading = false,
}: TransactionLogsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !tx.orderId.toLowerCase().includes(query) &&
          !tx.productName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && tx.status !== statusFilter) {
        return false;
      }

      // Payment method filter
      if (paymentMethodFilter && tx.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter !== "all") {
        const txDate = new Date(tx.createdAt);
        const now = new Date();
        const daysAgo = parseInt(dateRangeFilter);

        if (isNaN(daysAgo)) return true;

        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        if (txDate < cutoffDate) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, statusFilter, paymentMethodFilter, dateRangeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "FAILED":
        return "bg-red-500/20 text-red-300 border-red-400/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Dikonfirmasi";
      case "PENDING":
        return "Menunggu";
      case "FAILED":
        return "Gagal";
      default:
        return status;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Transaction Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <motion.div
          className="mb-6 space-y-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Cari Order ID atau Produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Status {statusFilter && <span className="ml-1">✓</span>}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-white/10">
                <DropdownMenuItem
                  onClick={() => setStatusFilter(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Semua Status
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => setStatusFilter("CONFIRMED")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Dikonfirmasi
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("PENDING")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Menunggu
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("FAILED")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Gagal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Payment Method Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Metode {paymentMethodFilter && <span className="ml-1">✓</span>}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-white/10">
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Semua Metode
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("QRIS")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  QRIS
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("E-WALLET")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  E-Wallet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPaymentMethodFilter("VA")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Virtual Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Range Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Tanggal
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900 border-white/10">
                <DropdownMenuItem
                  onClick={() => setDateRangeFilter("all")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Semua Waktu
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => setDateRangeFilter("1")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  24 Jam Terakhir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDateRangeFilter("7")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  7 Hari Terakhir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDateRangeFilter("30")}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  30 Hari Terakhir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Transaction Table */}
        {isLoading ? (
          <div className="text-center text-white/60 py-8">Loading...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            Tidak ada transaksi yang sesuai dengan filter
          </div>
        ) : (
          <motion.div
            className="overflow-x-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-medium">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">
                    Produk
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">
                    Jumlah
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">
                    Metode
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-medium">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-3 px-4 text-white font-mono text-xs">
                      {tx.orderId}
                    </td>
                    <td className="py-3 px-4 text-white/80">{tx.productName}</td>
                    <td className="py-3 px-4 text-white">
                      Rp {tx.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-white/80">{tx.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(tx.status)}>
                        {getStatusLabel(tx.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Results Summary */}
        <motion.div
          className="mt-4 text-xs text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
        </motion.div>
      </CardContent>
    </Card>
  );
}
