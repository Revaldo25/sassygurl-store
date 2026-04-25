import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { loginRateLimiter } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  
  // 1. CEK DINDING API (Rate Limit)
  const { success } = await loginRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." }, { status: 429 });
  }

  const { email, password } = await req.json();

  // 2. VERIFIKASI IDENTITAS AWAL
  const user = await prisma.user.findUnique({ where: { email } });
  // ... (Logika cek bcrypt password di sini) ...

  // 3. CEK APAKAH 2FA AKTIF
  if (user?.isTwoFactorEnable) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6 Digit
    
    // Simpan ke Database dengan masa berlaku 5 menit
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otpCode,
        expires: new Date(Date.now() + 5 * 60 * 1000),
      }
    });

    // DI SINI: Panggil fungsi kirim Email atau WA (Provider seperti Twilio/Wablas)
    console.log(`Kirim OTP ${otpCode} ke ${email}`);

    return NextResponse.json({ twoFactor: true, message: "OTP dikirim ke Email/WA Anda" });
  }

  return NextResponse.json({ twoFactor: false, message: "Login Berhasil" });
}