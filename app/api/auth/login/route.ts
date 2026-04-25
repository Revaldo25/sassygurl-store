import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // PASSWORD RAHASIA ANDA (Silakan ganti sesuai keinginan)
    const ADMIN_USER = "owner";
    const ADMIN_PASS = "sassy123";

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // PERBAIKAN: Gunakan 'await' sebelum memanggil cookies()
      const cookieStore = await cookies();
      
      cookieStore.set("sassy_admin_token", "super-secret-token-123", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 24 Jam
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    // Jika salah
    return NextResponse.json({ success: false, error: "Username atau Password salah!" }, { status: 401 });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}