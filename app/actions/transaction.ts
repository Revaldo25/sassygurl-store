"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 1. ZOD SCHEMA UNTUK VALIDASI (Standard Enterprise)
const TransactionSchema = z.object({
  gameId: z.string().min(1, "Game wajib dipilih"),
  productId: z.string().min(1, "Produk wajib dipilih"),
  targetId: z.string().min(1, "ID Player wajib diisi"), 
  zoneId: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  whatsapp: z.string().min(9, "Nomor WA tidak valid"),
  paymentId: z.string().min(1, "Metode Pembayaran wajib dipilih"),
  quantity: z.number().min(1).default(1),
});

export async function createTransaction(formData: any) {
  try {
    const parsed = TransactionSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const data = parsed.data;

    // Ambil data produk dan relasi gamenya
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { game: true }
    });

    if (!product || !product.isActive) {
      return { success: false, message: "Produk tidak ditemukan atau sedang tidak aktif." };
    }

    const payment = await prisma.paymentMethod.findUnique({
      where: { id: data.paymentId }
    });

    if (!payment || !payment.isActive) {
      return { success: false, message: "Metode pembayaran tidak valid." };
    }

    // 2. KALKULASI HARGA PRESISI (Konversi Decimal ke Number agar aman)
    const subTotal = Number(product.priceSell) * data.quantity;
    
    // Kalkulasi biaya admin
    let adminFee = Number(payment.feeFlat) + (subTotal * Number(payment.feePercent) / 100);
    const taxVat = 0; // Tambahkan logika PPN di sini jika diperlukan nanti
    const discount = 0; // Tambahkan logika Promo di sini
    
    const totalAmount = subTotal + adminFee + taxVat - discount;
    const profit = (Number(product.priceSell) - Number(product.priceModal)) * data.quantity;

    // Generate Invoice Unik (Format: INV-TIMESTAMP-RANDOM)
    const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 3. SIMPAN KE DATABASE (Mapping dengan Skema Enterprise)
    const newTransaction = await prisma.transaction.create({
      data: {
        invoiceId,
        gameId: data.gameId,
        productId: data.productId,
        sku: product.sku, 
        denomName: product.name,
        targetId: data.targetId, 
        zoneId: data.zoneId || null,
        email: data.email || null,
        whatsapp: data.whatsapp,
        paymentId: data.paymentId,
        
        // Simpan harga ke database
        priceModal: Number(product.priceModal) * data.quantity,
        priceSell: Number(product.priceSell) * data.quantity,
        adminFee: adminFee,
        taxVat: taxVat,
        discount: discount,
        totalAmount: totalAmount,
        profit: profit,
        
        paymentStatus: "UNPAID",
        orderStatus: "PENDING",
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expired dalam 24 jam
      }
    });

    // 4. REQUEST KE PAYMENT GATEWAY (Midtrans/Tripay/dll)
    // TODO: Ganti baris ini dengan pemanggilan API Payment Gateway asli Bosku
    const simulatedToken = `SNAP-${invoiceId}-${Math.random().toString(36).substring(7)}`;

    // 5. UPDATE TRANSAKSI DENGAN TOKEN/REFERENSI PEMBAYARAN
    await prisma.transaction.update({
      where: { id: newTransaction.id },
      data: {
        paymentRef: simulatedToken // Simpan token di kolom paymentRef
      }
    });

    return { 
      success: true, 
      message: "Transaksi berhasil dibuat!",
      invoiceId: newTransaction.invoiceId,
      paymentToken: simulatedToken
    };

  } catch (error) {
    console.error("TRANSACTION_ERROR:", error);
    return { success: false, message: "Terjadi kesalahan sistem saat memproses transaksi." };
  }
}