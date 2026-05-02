import { getMemberDashboardStats, getMemberTransactions } from "@/app/actions/dashboard";
import SiteHeader from "@/components/SiteHeader";
import MemberDashboardClient from "./MemberDashboardClient";

export const metadata = {
  title: "Dashboard — SassyGurl Store Ultra",
  description: "Panel member premium SassyGurl Store",
};

export default async function DashboardPage() {
  const [stats, transactions] = await Promise.all([
    getMemberDashboardStats(),
    getMemberTransactions("ALL", ""),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />
      <MemberDashboardClient initialStats={stats} initialTransactions={transactions} />
    </main>
  );
}