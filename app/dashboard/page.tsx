import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  getOwnerStats, 
  getAdminStats, 
  getAdminTransactions, 
  getAdminGames,
  getMemberDashboardStats,
  getMemberTransactions
} from "@/app/actions/dashboard";
import { getProviderStatuses } from "@/lib/api-adapter";
import MemberDashboardClient from "./MemberDashboardClient";
import AdminDashboardClient from "../admin/AdminDashboardClient";

export const metadata = {
  title: "Dashboard — SassyGurl Store Ultra",
  description: "Enterprise Command Center",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = (session.user as any).role?.toUpperCase() || "MEMBER";
  const isAdminOrOwner = ["SUPERADMIN", "OWNER", "FINANCE", "CS", "ADMIN"].includes(role);

  if (isAdminOrOwner) {
    // Fetch Admin/Owner Data
    const [stats, { transactions }, providerStatuses, games] = await Promise.all([
      (role === "SUPERADMIN" || role === "OWNER") ? getOwnerStats() : getAdminStats(),
      getAdminTransactions("ALL", "", 1, 15),
      getProviderStatuses(),
      getAdminGames(),
    ]);

    return (
      <AdminDashboardClient 
        initialStats={stats} 
        initialTransactions={transactions} 
        providerStatuses={providerStatuses} 
        initialGames={games}
        role={role} 
      />
    );
  }

  // Fetch Member Data
  const [memberStats, memberTransactions] = await Promise.all([
    getMemberDashboardStats(),
    getMemberTransactions("ALL", ""),
  ]);

  return (
    <MemberDashboardClient 
      initialStats={memberStats} 
      initialTransactions={memberTransactions} 
      session={session} 
    />
  );
}