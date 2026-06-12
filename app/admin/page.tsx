import { getOwnerStats, getAdminStats, getAdminTransactions, getAdminGames } from "@/app/actions/dashboard";
import { getProviderStatuses } from "@/lib/api-adapter";
import AdminDashboardClient from "./AdminDashboardClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Panel — SassyGurl Store Ultra",
  description: "Command Center untuk mengelola SassyGurl Store",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = (session.user as any).role as string;
  if (!["SUPERADMIN", "FINANCE", "CS"].includes(role)) {
    redirect("/");
  }

  const [stats, { transactions, total }, providerStatuses, games] = await Promise.all([
    role === "SUPERADMIN" ? getOwnerStats() : getAdminStats(),
    getAdminTransactions("ALL", "", 1, 15),
    getProviderStatuses(),
    getAdminGames(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AdminDashboardClient 
        initialStats={stats} 
        initialTransactions={transactions} 
        initialTotal={total}
        providerStatuses={providerStatuses} 
        initialGames={games}
        role={role} 
      />
    </main>
  );
}