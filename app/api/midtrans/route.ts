import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // 1. Tangkap surat laporan dari Midtrans
    const body = await request.json();
    
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status
    } = body;

    // Ambil Kunci Rahasia Server dari .env
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';

    // 2. VERIFIKASI KEAMANAN (ANTI-HACKER SULTAN LEVEL)
    // Kita cek apakah laporan ini beneran dari Midtrans atau dari Hacker
    const hash = crypto.createHash('sha512');
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`);
    const calculatedSignature = hash.digest('hex');

    if (calculatedSignature !== signature_key) {
      console.error("🚨 PERINGATAN: Ada percobaan webhook palsu!");
      return NextResponse.json({ message: 'Invalid Signature' }, { status: 403 });
    }

    // 3. TERJEMAHKAN BAHASA MIDTRANS KE BAHASA DATABASE KITA
// Cari bagian ini dan ubah menjadi:
    let newStatus: PaymentStatus = 'PENDING'; // <--- Beri tipe PaymentStatus

    if (transaction_status === 'capture') {
        newStatus = fraud_status === 'accept' ? 'PAID' : 'FAILED';
    } else if (transaction_status === 'settlement') {
        newStatus = 'PAID'; 
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
        newStatus = 'FAILED'; 
    } else if (transaction_status === 'pending') {
        newStatus = 'PENDING';
    }

    // 4. UPDATE DATABASE PRISMA
    // Pastikan order_id yang dikirim sama dengan invoiceId di database kita
    const updatedTx = await prisma.transaction.update({
      where: { invoiceId: order_id }, 
      data: { paymentStatus: newStatus }
    });

    console.log(`✅ NOTIFIKASI MIDTRANS: Pesanan ${order_id} berhasil diupdate menjadi ${newStatus}`);

    // (OPSIONAL NANTI): Jika newStatus === 'PAID', di sini Bosku bisa panggil 
    // API Provider (Digiflazz/VIP) untuk otomatis tembak Diamond ke akun pembeli.

    return NextResponse.json({ message: 'Webhook Berhasil Diterima' }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}