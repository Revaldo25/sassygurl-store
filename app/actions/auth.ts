"use server";

import { fetchApi } from "@/lib/api-client";
import { z } from "zod";
import { cookies } from "next/headers";

const AuthSchema = z.object({
  action: z.enum(["login", "register"]),
  method: z.enum(["email", "phone"]),
  email: z.string().email("Format email salah").optional().or(z.literal("")),
  phone: z.string().min(9, "Nomor WhatsApp tidak valid").optional().or(z.literal("")),
  name: z.string().optional(),
  password: z.string().min(6, "Password minimal 6 karakter"),
}).refine(data => {
  if (data.method === "email" && !data.email) return false;
  if (data.method === "phone" && !data.phone) return false;
  return true;
}, {
  message: "Email atau Nomor WhatsApp wajib diisi sesuai metode",
  path: ["email"]
});

type AuthInput = z.infer<typeof AuthSchema>;

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
};

type AuthResponseDto = {
  token: string;
  userId: string;
  name: string;
  role: string;
};

type CurrentUserDto = {
  userId: string;
  name: string;
  role: string;
};

export async function processAuth(input: any) {
  try {
    const data = AuthSchema.parse(input);
    const endpoint = data.action === "login" ? "/auth/login" : "/auth/register";

    const response = await fetchApi<ApiResponse<any>>(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!response.success) {
      return { success: false, message: response.message };
    }

    if (data.action === "login") {
      const authData = response.data as AuthResponseDto;
      const cookieStore = await cookies();
      cookieStore.set("auth_token", authData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
      return { success: true, message: response.message };
    } else {
      // Register returns OTP identifier
      return { success: true, message: response.message, step: "verify_otp", identifier: response.data };
    }
  } catch (error: any) {
    console.error("[Auth Action] Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return { success: false, message: error.message || "Terjadi kesalahan sistem." };
  }
}

export async function verifyOtpAction(identifier: string, otp: string) {
  try {
    if (!otp || otp.length !== 6) {
      return { success: false, message: "Kode OTP harus 6 digit." };
    }

    const response = await fetchApi<ApiResponse<AuthResponseDto>>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, otp })
    });

    if (!response.success) {
      return { success: false, message: response.message };
    }

    const authData = response.data;
    const cookieStore = await cookies();
    cookieStore.set("auth_token", authData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return { success: true, message: response.message };
  } catch (error: any) {
    console.error("[Verify OTP] Error:", error);
    return { success: false, message: error.message || "Gagal verifikasi OTP." };
  }
}

export async function getCurrentMemberAction() {
  try {
    const response = await fetchApi<ApiResponse<CurrentUserDto>>("/auth/me");
    if (!response.success || !response.data) {
      return { success: false, message: response.message || "Unauthorized" };
    }

    return {
      success: true,
      member: {
        id: response.data.userId,
        name: response.data.name,
        role: response.data.role,
      },
    };
  } catch {
    return { success: false, message: "Unauthorized" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}