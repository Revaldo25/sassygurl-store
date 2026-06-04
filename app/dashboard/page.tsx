import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  getMemberDashboardStats,
  getMemberTransactions
} from "@/app/actions/dashboard";
import MemberDashboardClient from "./MemberDashboardClient";

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
    redirect("/admin");
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