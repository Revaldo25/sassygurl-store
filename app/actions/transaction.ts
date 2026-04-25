"use server";

import { prisma } from "@/lib/prisma";

// Tipe data yang diterima dari Frontend
interface CheckoutPayload {
  productId: string;
  targetId: string;
  zoneId?: string;
  server?: string;
  quantity: number;
  paymentMethod: string;
  email: string;
  whatsapp: string;
  waNotif: boolean;
}

export async function createTransaction(data: CheckoutPayload) {
  try {
    // 1. CARI PRODUK DI DATABASE (Keamanan: Jangan percaya harga dari frontend!)
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { game: true }
    });

    if (!product) throw new Error("Produk tidak ditemukan, Bosku!");

    // 2. KALKULASI HARGA PRESISI
    const subTotal = product.priceSell * data.quantity;
    
    // Simulasi biaya admin berdasarkan metode pembayaran
    let adminFee = 0;
    if (data.paymentMethod.includes("QRIS")) adminFee = 750;
    else if (data.paymentMethod.includes("VA")) adminFee = 4000;
    else adminFee = 1500; // E-Wallet & Lainnya

    const notifFee = data.waNotif ? 500 : 0;
    
    // (Opsional) Logika Kupon Promo bisa disisipkan di sini
    const discount = 0; 

    const grossAmount = subTotal + adminFee + notifFee - discount;
    const profit = (product.priceSell - product.priceCost) * data.quantity + notifFee; // Untung bersih!

    // 3. BUAT INVOICE UNIK
    const invoiceId = `SGY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. SIMPAN TRANSAKSI KE DATABASE (Status: PENDING)
    const transaction = await prisma.transaction.create({
      data: {
        invoiceId,
        productId: product.id,
        targetPlayerId: data.zoneId ? `${data.targetId} (${data.zoneId})` : data.targetId,
        whatsapp: data.whatsapp,
        amount: grossAmount,
        profit: profit,
        orderStatus: "PENDING",
        paymentStatus: "UNPAID",
      }
    });

    // 5. MINTA TOKEN KE MIDTRANS (Menggunakan Fetch native Next.js 15)
    // Gunakan URL Sandbox untuk testing, ganti ke production nanti
    const midtransUrl = process.env.NODE_ENV === "production" 
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const midtransAuth = Buffer.from(process.env.MIDTRANS_SERVER_KEY + ":").toString("base64");

    const midtransResponse = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${midtransAuth}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: invoiceId,
          gross_amount: grossAmount
        },
        item_details: [
          {
            id: product.skuCode,
            price: product.priceSell,
            quantity: data.quantity,
            name: `${product.game.name} - ${product.name}`
          },
          { id: "FEE", price: adminFee, quantity: 1, name: "Biaya Layanan" },
          ...(data.waNotif ? [{ id: "WA", price: 500, quantity: 1, name: "Notifikasi WA" }] : [])
        ],
        customer_details: {
          first_name: data.targetId,
          email: data.email || "sultan@sassygurl.com",
          phone: data.whatsapp
        }
      })
    });

    const midtransData = await midtransResponse.json();

    if (!midtransData.token) {
      console.error("Midtrans Error:", midtransData);
      throw new Error("Gagal mengambil token Midtrans.");
    }

    // 6. UPDATE DATABASE DENGAN TOKEN MIDTRANS
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { snapToken: midtransData.token }
    });

    // 7. KEMBALIKAN TOKEN KE FRONTEND
    return { success: true, token: midtransData.token, invoiceId };

  } catch (error: any) {
    console.error("Transaction Error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}