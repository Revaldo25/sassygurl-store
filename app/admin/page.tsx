import { getAdminStats, getAdminTransactions } from "@/app/actions/dashboard";
import { getProviderStatuses } from "@/lib/api-adapter";
import SiteHeader from "@/components/SiteHeader";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata = {
  title: "Admin Panel — SassyGurl Store Ultra",
  description: "Command Center untuk mengelola SassyGurl Store",
};

export default async function AdminPage() {
  const [stats, { transactions }, providerStatuses] = await Promise.all([
    getAdminStats(),
    getAdminTransactions("ALL", "", 1, 15),
    getProviderStatuses(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />
      <AdminDashboardClient initialStats={stats} initialTransactions={transactions} providerStatuses={providerStatuses} />
    </main>
  );
}