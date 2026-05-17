import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = (session.user as any).role || "MEMBER";

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-sakura/30 selection:text-sakura">
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <main className="transition-all duration-300 lg:pl-[280px]">
        <div className="mx-auto max-w-[1400px] p-4 sm:p-8 lg:p-12">
          {children}
        </div>
      </main>

      {/* Grid Background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
      </div>
    </div>
  );
}
