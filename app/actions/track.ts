"use server";

import { prisma } from "@/lib/prisma";

export async function trackOrderAction(query: string) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { invoiceId: query },
          { whatsapp: query } // Jika Anda menyimpan nomor WA di tabel transaksi
        ]
      },
      include: {
        product: {
          include: { game: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (transactions.length === 0) {
      return { success: false, message: "Pesanan tidak ditemukan. Cek kembali ID Invoice Anda." };
    }

    return { success: true, data: transactions };
  } catch (error) {
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}