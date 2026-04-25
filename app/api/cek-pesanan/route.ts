import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: "Nomor Invoice wajib diisi!" }, { status: 400 });
    }

    // Cari transaksi berdasarkan Nomor Invoice
    const transaction = await prisma.transaction.findUnique({
      where: { invoiceId: invoiceId.trim() },
      include: { 
        product: {
          include: { category: true }
        } 
      }
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Pesanan tidak ditemukan. Pastikan nomor invoice benar (contoh: SGY-123456)." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transaction });

  } catch (error) {
    console.error("Error Cek Pesanan:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}