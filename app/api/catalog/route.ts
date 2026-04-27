import { NextResponse } from "next/server";
import { games, paymentMethods } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json({
    ok: true,
    games,
    paymentMethods,
  });
}
