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

  if (!session) {
    redirect("/auth/login");
  }

  const role = (session?.user as any)?.role || "MEMBER";

  // Fetch Member Data
  const [memberStats, memberTransactions] = await Promise.all([
    getMemberDashboardStats(),
    getMemberTransactions("ALL", ""),
  ]);

  return (
    <MemberDashboardClient 
      initialStats={memberStats} 
      initialTransactions={memberTransactions.data || []} 
      session={session} 
    />
  );
}