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