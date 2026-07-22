import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAffiliateDashboardData } from "@/app/actions/dashboard";
import AffiliateClient from "./AffiliateClient";

export const metadata = {
  title: "Affiliate Dashboard — SassyGurl Store",
  description: "Manage your affiliate earnings and referrals",
};

export default async function AffiliateDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const data = await getAffiliateDashboardData();

  return <AffiliateClient data={data} />;
}
