import { getGameBySlug } from "@/lib/catalog";
import GameExperienceClient from "@/components/GameExperienceClient";
import { notFound } from "next/navigation";

export default async function GameSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return notFound();
  return <GameExperienceClient game={game} />;
}
