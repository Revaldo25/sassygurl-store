import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { productId, targetId, zoneId, whatsapp } = await JSON.parse(await req.text());

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { game: true, provider: true } // 👈 Relasi yang benar
    });

    if (!product) return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });

    // KALKULASI MATEMATIKA AMAN
    const price = Number(product.priceSell);
    const fee = 0; // Sesuaikan jika ada biaya tambahan
    const total = price + fee;

    const transaction = await prisma.transaction.create({
      data: {
        invoiceId: `INV-${Date.now()}`,
        productId: product.id,
        gameId: product.gameId,
        sku: product.sku,
        denomName: product.name,
        targetId: targetId,
        zoneId: zoneId || null,
        whatsapp: whatsapp,
        paymentId: "PASTI-ADA-ID", // Sesuaikan dengan logic paymentId Bosku
        priceModal: product.priceModal,
        priceSell: product.priceSell,
        adminFee: fee,
        totalAmount: total,
        profit: Number(product.priceSell) - Number(product.priceModal),
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error Internal" }, { status: 500 });
  }
}