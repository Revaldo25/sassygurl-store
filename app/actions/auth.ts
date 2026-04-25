"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";

// 1. ZOD SCHEMAS (Aturan Validasi Ketat)
const AuthSchema = z.object({
  action: z.enum(["login", "register"]),
  method: z.enum(["email", "phone"]),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  phone: z.string().min(9, "Nomor WA terlalu pendek").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter"),
  name: z.string().optional(),
}).refine((data) => {
  if (data.method === "email" && !data.email) return false;
  if (data.method === "phone" && !data.phone) return false;
  return true;
}, { message: "Email atau Nomor WA wajib diisi sesuai metode", path: ["method"] });

const OtpSchema = z.object({
  identifier: z.string().min(1, "Identitas tidak ditemukan"),
  otp: z.string().length(6, "OTP harus 6 digit"),
});

// KONFIGURASI EMAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
});

// 2. SERVER ACTION UTAMA
export async function processAuth(formData: any) {
  try {
    // Validasi input menggunakan Zod
    const parsed = AuthSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }

    const { action, method, email, phone, password, name } = parsed.data;
    const identifier = method === "email" ? email! : phone!;

    // --- PROSES REGISTER ---
    if (action === "register") {
      // Cek apakah user sudah ada di database (Ganti member jadi user)
      const exist = await prisma.user.findFirst({
        where: { OR: [{ email: email || undefined }, { phone: phone || undefined }] }
      });
      if (exist) return { success: false, message: "Identitas sudah terdaftar!" };

      const hashedPassword = await bcrypt.hash(password, 12);

      // Simpan User ke DB
      const newUser = await prisma.user.create({
        data: {
          name: name || "Member VIP",
          // Pastikan kita kirim 'null', bukan 'undefined'
          email: method === "email" ? (email || null) : null,
          phone: method === "phone" ? (phone || null) : null,
          password: hashedPassword,
          isVerified: false
        }
      });

      // Buat OTP dan simpan di tabel terpisah (VerificationToken)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.verificationToken.create({
        data: {
          identifier: identifier,
          token: generatedOtp,
          expires: new Date(Date.now() + 10 * 60 * 1000) // 10 menit
        }
      });

      // Kirim Email
      if (method === "email") {
        await transporter.sendMail({
          from: `"SassyGurl Security" <${process.env.EMAIL_USER}>`,
          to: email!,
          subject: "🔐 Kode OTP Aktivasi SassyGurlStore",
          html: `<div style="background:#05050a; padding:40px; color:#fff; border-radius:24px; text-align:center;">
                  <h2 style="color:#ec4899">Verifikasi Akun Anda</h2>
                  <h1 style="letter-spacing:10px; font-size:36px; background:rgba(255,255,255,0.05); padding:20px; border-radius:12px; display:inline-block;">${generatedOtp}</h1>
                </div>`
        });
      }

      return { success: true, step: "verify_otp", message: "OTP Terkirim ke " + identifier };
    }

    // --- PROSES LOGIN ---
    if (action === "login") {
      // Ganti member jadi user
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: email || undefined }, { phone: phone || undefined }] }
      });

      if (!user) return { success: false, message: "Akun tidak ditemukan." };
      if (!user.isVerified) return { success: false, message: "Akun belum aktif! Silakan daftar ulang/verifikasi." };

      // Hati-hati, user.password bisa null jika dia login via Google/Facebook
      if (!user.password) return { success: false, message: "Gunakan tombol Login Google/Facebook!" };

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return { success: false, message: "Password Anda salah!" };

      // Set Secure Cookie
      const cookieStore = await cookies();
      cookieStore.set("sassy_member_session", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return { success: true, message: "Login Berhasil!" };
    }

    return { success: false, message: "Aksi tidak dikenal" };
  } catch (error) {
    console.error("AUTH_ERROR:", error);
    return { success: false, message: "Terjadi kesalahan server internal." };
  }
}

// 3. SERVER ACTION UNTUK VERIFIKASI OTP
export async function verifyOtpAction(identifier: string, otp: string) {
  try {
    const parsed = OtpSchema.safeParse({ identifier, otp });
    if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };

    // Cari token di database
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { identifier, token: otp }
    });

    if (!tokenRecord) return { success: false, message: "Kode OTP Salah atau tidak ditemukan!" };
    if (new Date() > tokenRecord.expires) return { success: false, message: "Kode OTP sudah kedaluwarsa!" };

    // Update user jadi verified
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] }
    });

    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
      
      // Hapus token yang sudah terpakai (menggunakan deleteMany agar tidak bentrok dengan strict unique constraint)
      await prisma.verificationToken.deleteMany({
        where: { identifier: identifier, token: otp }
      });

      // Set Cookie Login langsung setelah berhasil verifikasi
      const cookieStore = await cookies();
      cookieStore.set("sassy_member_session", user.id, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite: "lax", 
        maxAge: 60 * 60 * 24 * 30, 
        path: "/",
      });

      return { success: true, message: "Verifikasi Berhasil!" };
    }

    return { success: false, message: "User tidak ditemukan" };
  } catch (error) {
    console.error("OTP_ERROR:", error);
    return { success: false, message: "Gagal memverifikasi OTP." };
  }
}