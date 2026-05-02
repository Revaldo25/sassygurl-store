import { getGameProducts, getGroupedPayments } from "@/lib/api-adapter";
import GameExperienceClient from "@/components/GameExperienceClient";
import { notFound } from "next/navigation";

export default async function GameSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch from ASP.NET Core API (both fetches run in parallel)
  const [{ game, groupedByCategory, products }, paymentGroups] = await Promise.all([
    getGameProducts(slug),
    getGroupedPayments(),
  ]);

  if (!game) return notFound();

  return (
    <GameExperienceClient
      game={game}
      products={products}
      groupedByCategory={groupedByCategory}
      paymentGroups={paymentGroups}
    />
  );
}
