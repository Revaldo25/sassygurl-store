import { redirect } from "next/navigation";

// Legacy MLBB page — redirect to dynamic game route
export default function MLBBPage() {
  redirect("/game/mlbb");
}
