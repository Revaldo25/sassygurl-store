"use server";

import { fetchApi } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type TrackResult = {
  invoiceId: string;
  gameName: string;
  productName: string;
  targetId: string;
  zoneId?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  sn?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
};

export async function trackOrderAction(query: string) {
  try {
    if (!query || query.trim().length < 3) {
      return { success: false, message: "Masukkan Invoice ID atau No. WhatsApp untuk melacak pesanan." };
    }

    const response = await fetchApi<ApiResponse<TrackResult>>(`/track/${encodeURIComponent(query.trim())}`);

    if (!response.success) {
      return { success: false, message: response.message };
    }

    return {
      success: true,
      message: "Pesanan ditemukan!",
      data: response.data
    };
  } catch (error: any) {
    console.error("[Track Action] Error:", error);
    return { success: false, message: error.message || "Terjadi kesalahan saat melacak pesanan." };
  }
}