"use server";

import { fetchApi } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};
export type FlashSaleConfig = {
  isActive: boolean;
  forceTrigger: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  discountPercent: number;
  gameIds: string[];
};

export async function getFlashSaleConfig() {
  try {
    const res = await fetchApi<ApiResponse<FlashSaleConfig>>("/AdminFlashSale/config");
    return res;
  } catch (error: any) {
    console.error("Error getFlashSaleConfig:", error);
    return { success: false, message: error.message, data: undefined };
  }
}

export async function saveFlashSaleConfig(config: FlashSaleConfig) {
  try {
    const res = await fetchApi<ApiResponse<any>>("/AdminFlashSale/config", {
      method: "POST",
      body: JSON.stringify(config)
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return res;
  } catch (error: any) {
    console.error("Error saveFlashSaleConfig:", error);
    return { success: false, message: error.message, data: undefined };
  }
}

export async function forceTriggerFlashSale() {
  try {
    const res = await fetchApi<ApiResponse<any>>("/AdminFlashSale/trigger", {
      method: "POST"
    });
    revalidatePath("/");
    revalidatePath("/admin");
    return res;
  } catch (error: any) {
    console.error("Error forceTriggerFlashSale:", error);
    return { success: false, message: error.message, data: undefined };
  }
}
