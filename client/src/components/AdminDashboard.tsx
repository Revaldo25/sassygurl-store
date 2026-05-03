import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";
import { TransactionLogs, Transaction } from "./TransactionLogs";

// Sample data for charts
const revenueData = [
  { date: "1 Mei", revenue: 4500000, transactions: 45 },
  { date: "2 Mei", revenue: 5200000, transactions: 52 },
  { date: "3 Mei", revenue: 4800000, transactions: 48 },
  { date: "4 Mei", revenue: 6100000, transactions: 61 },
  { date: "5 Mei", revenue: 7300000, transactions: 73 },
  { date: "6 Mei", revenue: 8200000, transactions: 82 },
  { date: "7 Mei", revenue: 9100000, transactions: 91 },
];

const paymentMethodData = [
  { name: "QRIS", value: 35, color: "#6366f1" },
  { name: "E-Wallet", value: 40, color: "#f97316" },
  { name: "Virtual Account", value: 20, color: "#06b6d4" },
  { name: "Retail", value: 5, color: "#8b5cf6" },
];

const topProducts = [
  { name: "Mobile Legends - 500 Diamonds", revenue: 2500000, sales: 250 },
  { name: "Free Fire - 100 Diamonds", revenue: 1800000, sales: 180 },
  { name: "PUBG Mobile - UC 1800", revenue: 1500000, sales: 75 },
  { name: "Genshin Impact - Genesis Crystals", revenue: 1200000, sales: 60 },
];

export function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("7days");

  const stats = [
    {
      label: "Total Revenue",
      value: "Rp 46.3M",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      label: "Total Transactions",
      value: "452",
      change: "+8.2%",
      icon: ShoppingCart,
      color: "text-blue-400",
    },
    {
      label: "Active Users",
      value: "1,234",
      change: "+5.3%",
      icon: Users,
      color: "text-purple-400",
    },
    {
      label: "Avg. Order Value",
      value: "Rp 102.5K",
      change: "+3.1%",
      icon: TrendingUp,
      color: "text-orange-400",
    },
  ];

  // Sample transaction data
  const sampleTransactions: Transaction[] = [
    {
      id: "1",
      orderId: "ORD1000001",
      productName: "Mobile Legends - 500 Diamonds",
      amount: 102500,
      paymentMethod: "QRIS",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      userId: 1,
    },
    {
      id: "2",
      orderId: "ORD1000002",
      productName: "Free Fire - 100 Diamonds",
      amount: 98000,
      paymentMethod: "E-WALLET",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      userId: 2,
    },
    {
      id: "3",
      orderId: "ORD1000003",
      productName: "PUBG Mobile - UC 1800",
      amount: 299000,
      paymentMethod: "VA",
      status: "PENDING",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      userId: 3,
    },
    {
      id: "4",
      orderId: "ORD1000004",
      productName: "Genshin Impact - Genesis Crystals",
      amount: 199000,
      paymentMethod: "E-WALLET",
      status: "FAILED",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      userId: 4,
    },
    {
      id: "5",
      orderId: "ORD1000005",
      productName: "Mobile Legends - 1000 Diamonds",
      amount: 199000,
      paymentMethod: "QRIS",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      userId: 5,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-white/60">Pantau performa SassyGurl secara real-time</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/60 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">
                        {stat.value}
                      </p>
                      <p className="text-xs text-green-400 mt-2">{stat.change}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #ffffff20",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #ffffff20",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {paymentMethodData.map((method) => (
                  <div key={method.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: method.color }}
                      />
                      <span className="text-white/80">{method.name}</span>
                    </div>
                    <span className="text-white font-semibold">{method.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <motion.div
                  key={product.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {product.name}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      {product.sales} penjualan
                    </p>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
                    Rp {(product.revenue / 1000000).toFixed(1)}M
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transaction Logs with Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <TransactionLogs transactions={sampleTransactions} />
      </motion.div>
    </div>
  );
}
