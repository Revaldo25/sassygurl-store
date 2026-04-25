"use server";

import { prisma } from "@/lib/prisma";

// FUNGSI UNTUK CEK KODE PROMO (DISKON SULTAN)
export async function validatePromoCode(code: string, amount: number) {
  try {
    // Nanti simpan daftar promo di tabel database Promo
    if (code === "SASSYNEW") {
      const discount = amount * 0.1; // Diskon 10%
      return { success: true, discount, message: "Kode Promo Berhasil Digunakan! Kamu hemat Rp " + discount.toLocaleString('id-ID') };
    }
    return { success: false, message: "Kode promo tidak valid atau sudah kadaluarsa." };
  } catch (error) {
    return { success: false, message: "Error sistem promo." };
  }
}