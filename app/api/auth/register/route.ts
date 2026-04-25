import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    // 1. Validasi Input Dasar
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // 2. Cek Duplikasi (Email / WA tidak boleh ada yang sama)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email atau Nomor WA sudah terdaftar di sistem!" }, { status: 409 });
    }

    // 3. Enkripsi Keamanan Tingkat Tinggi (Bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate Kode Referral Unik untuk Member Baru
    const uniqueReferral = `SGY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 5. Simpan ke Database (Otomatis masuk tier MEMBER)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        referralCode: uniqueReferral,
      }
    });

    return NextResponse.json({ message: "Registrasi VIP Berhasil!" }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}