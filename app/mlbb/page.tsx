import { getGameBySlug } from "@/lib/catalog";
import GameExperienceClient from "@/components/GameExperienceClient";
import { notFound } from "next/navigation";

export default function MLBBPage() {
  const game = getGameBySlug("mlbb");
  if (!game) return notFound();
  return <GameExperienceClient game={game} />;
}
