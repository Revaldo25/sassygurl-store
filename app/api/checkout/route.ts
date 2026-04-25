import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // 0. Ambil tiket member jika pembeli sedang login
    const cookieStore = await cookies();
    const memberId = cookieStore.get("sassy_member_session")?.value;

    // 1. Terima data dari klik tombol Beli di Frontend
    const body = await req.json();
    const { userId, zoneId, wa, productId, paymentMethod } = body;

    // 2. Cek produk di database & cari modal termurahnya
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { 
        providerOptions: { orderBy: { priceCost: 'asc' } } 
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Waduh, produknya tidak ditemukan!" }, { status: 404 });
    }

    // 3. Hitung Keuntungan (Profit = Harga Jual - Modal Termurah)
    const bestProvider = product.providerOptions[0];
    const cost = bestProvider ? bestProvider.priceCost : product.priceSell;
    const profit = product.priceSell - cost;

    // 4. Buat Nomor Invoice Keren
    const invoiceId = `SGY-${Date.now().toString().slice(-6)}`;

    // 5. Simpan Pesanan ke Database Supabase
    const transaction = await prisma.transaction.create({
      data: {
        invoiceId: invoiceId,
        targetId: userId,
        targetZone: zoneId || "",
        whatsapp: wa,
        productId: product.id,
        priceSell: product.priceSell,
        priceCost: cost,
        profit: profit,
        paymentMethod: paymentMethod || "qris",
        orderStatus: "PENDING", 
        providerId: bestProvider ? bestProvider.providerId : null,
        memberId: memberId || null, // Di sini data membernya disambungkan
      }
    });

    // 6. Kirim konfirmasi balik ke Frontend
    return NextResponse.json({ 
      success: true, 
      invoiceId: transaction.invoiceId, 
      productName: product.name 
    });

  } catch (error) {
    console.error("Error Checkout:", error);
    return NextResponse.json({ error: "Gagal memproses pesanan di server" }, { status: 500 });
  }
}