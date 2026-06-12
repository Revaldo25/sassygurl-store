"use server";

import { revalidatePath } from "next/cache";
import { fetchApi } from "@/lib/api-client";

export async function getProductCategories(gameId: string) {
  try {
    const data = await fetchApi<any>(`/ProductCategories?gameId=${gameId}`, { cache: 'no-store' });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getAdminProductsByGame(gameId: string) {
  try {
    const data = await fetchApi<any>(`/Products/game/${gameId}`, { cache: 'no-store' });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createProductCategory(gameId: string, data: { name: string; icon: string; sortOrder: number }) {
  try {
    await fetchApi<any>(`/ProductCategories?gameId=${gameId}`, {
      method: "POST",
      body: JSON.stringify(data)
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateProductCategory(gameId: string, categoryId: string, data: { name: string; icon: string; sortOrder: number }) {
  try {
    await fetchApi<any>(`/ProductCategories/${categoryId}?gameId=${gameId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteProductCategory(gameId: string, categoryId: string) {
  try {
    await fetchApi<any>(`/ProductCategories/${categoryId}?gameId=${gameId}`, {
      method: "DELETE"
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function assignProductsToCategory(gameId: string, categoryId: string, productIds: string[]) {
  try {
    await fetchApi<any>(`/ProductCategories/${categoryId}/products?gameId=${gameId}`, {
      method: "PUT",
      body: JSON.stringify(productIds)
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
