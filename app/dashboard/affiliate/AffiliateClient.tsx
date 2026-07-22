"use client";

import { useState } from "react";
import { Copy, Users, Wallet, Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { requestAffiliateWithdrawal } from "@/app/actions/dashboard";

export default function AffiliateClient({ data }: { data: any }) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Affiliate Program</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Something went wrong loading your affiliate data. Please try again later.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(data.affiliateCode);
    toast.success("Affiliate code copied to clipboard!");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?ref=${data.affiliateCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Affiliate link copied to clipboard!");
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 50000) {
      toast.error("Minimum withdrawal amount is Rp 50.000");
      return;
    }

    if (amount > data.unpaidCommissions) {
      toast.error("Insufficient unpaid commissions");
      return;
    }

    setIsLoading(true);
    const result = await requestAffiliateWithdrawal(amount);
    setIsLoading(false);

    if (result.success) {
      toast.success("Withdrawal requested successfully!");
      setWithdrawAmount("");
      // Real app might update local state here
    } else {
      toast.error(result.message || "Failed to request withdrawal");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Share your code and earn commissions for every successful transaction.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Total Earned</h3>
            <Wallet className="h-4 w-4 text-brand-cyan" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              Rp {data.totalCommissions.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Lifetime earnings</p>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Available to Withdraw</h3>
            <Activity className="h-4 w-4 text-sakura" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sakura">
              Rp {data.unpaidCommissions.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Pending balance</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Referrals</h3>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {data.commissions.length}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Transactions using your code</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Your Affiliate Link</h3>
            <p className="text-sm text-zinc-400">Share this code or link with your friends</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Affiliate Code</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={data.affiliateCode} 
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm font-mono text-white" 
                />
                <button 
                  onClick={handleCopy}
                  className="flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 h-10 w-10 border border-white/10 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Link</label>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center rounded-md bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan h-10 font-bold transition-colors"
                >
                  Copy Referral Link
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Request Withdrawal</h3>
            <p className="text-sm text-zinc-400">Withdraw your earnings to your balance</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Withdraw</label>
              <input 
                type="number" 
                placeholder="Min. 50000" 
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sakura"
              />
            </div>
            <button 
              className="w-full flex items-center justify-center rounded-md bg-sakura hover:bg-sakura/90 text-white h-10 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleWithdraw} 
              disabled={isLoading || data.unpaidCommissions < 50000}
            >
              {isLoading ? "Processing..." : "Request Withdrawal"}
            </button>
            {data.unpaidCommissions < 50000 && (
              <p className="text-xs text-center text-zinc-400 mt-2">
                Minimum withdrawal amount is Rp 50.000.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Commission History</h3>
          <p className="text-sm text-zinc-400">Recent transactions using your code</p>
        </div>
        <div>
          {data.commissions.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">
              No commissions yet. Start sharing your code!
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {data.commissions.slice(0, 10).map((c: any) => (
                <div key={c.id} className="flex justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">Transaction #{c.transactionId.substring(0, 8)}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(c.createdAt).toLocaleDateString()} • {c.isPaid ? 'Paid' : 'Unpaid'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-sakura">+ Rp {c.amount.toLocaleString("id-ID")}</p>
                    {c.isPaid && <CheckCircle2 className="inline h-4 w-4 text-status-success ml-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
