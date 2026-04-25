import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Ambil semua pesanan terbaru
export async function GET() {
  const orders = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(orders);
}

// Update status pesanan (Misal: dari PENDING jadi SUCCESS)
export async function PATCH(req: Request) {
  const { id, status } = await req.json();
  const updated = await prisma.transaction.update({
    where: { id },
    data: { status }
  });
  return NextResponse.json(updated);
}