"use server";

import { fetchApi } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type PromoResult = {
  code: string;
  discount: number;
  description: string;
};

export async function validatePromoCode(code: string, amount: number) {
  try {
    if (!code || code.trim().length < 3) {
      return { success: false, message: "Masukkan kode promo yang valid." };
    }

    const response = await fetchApi<ApiResponse<PromoResult>>("/promos/validate", {
      method: "POST",
      body: JSON.stringify({ code: code.trim().toUpperCase(), amount }),
    });

    if (!response.success) {
      return { success: false, message: response.message };
    }

    return {
      success: true,
      discount: response.data.discount,
      message: response.data.description,
    };
  } catch (error: any) {
    console.error("[Promo Action] Error:", error);
    return { success: false, message: error.message || "Error sistem promo." };
  }
}

// ══════════════════════════════════════════════════════════════════════════
// ACCOUNT VALIDATION ACTION
// Gantikan fetch() di AccountInput.tsx agar URL backend tidak bocor ke browser
// ══════════════════════════════════════════════════════════════════════════
export async function validateAccountAction(
  gameCode: string,
  targetId: string,
  zoneId?: string
): Promise<{ success: boolean; nickname?: string; message?: string }> {
  try {
    if (!gameCode?.trim() || !targetId?.trim()) {
      return { success: false, message: "GameCode dan TargetId wajib diisi." };
    }
    const response = await fetchApi<ApiResponse<{ nickname: string }>>(
      "/game/validate",
      {
        method: "POST",
        body: JSON.stringify({ gameCode: gameCode.trim(), targetId: targetId.trim(), zoneId: zoneId?.trim() }),
      }
    );
    if (response.success && response.data?.nickname) {
      return { success: true, nickname: response.data.nickname };
    }
    return { success: false, message: response.message || "ID tidak ditemukan. Periksa kembali." };
  } catch (error: any) {
    return { success: false, message: "Gagal memvalidasi akun. Coba lagi." };
  }
}
