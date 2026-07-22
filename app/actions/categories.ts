"use server";

import { revalidatePath } from "next/cache";
import { fetchApi } from "@/lib/api-client";

export async function getProductCategories(gameId: string) {
  try {
    const data = await fetchApi<any>(`/admin/catalog/games/${gameId}/categories`, { cache: 'no-store' });
    return { success: true, data: data.data || data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getAdminProductsByGame(gameId: string) {
  try {
    const data = await fetchApi<any>(`/admin/catalog/games/${gameId}/products`, { cache: 'no-store' });
    return { success: true, data: data.data || data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createProductCategory(gameId: string, data: { name: string; icon: string; sortOrder: number }) {
  try {
    await fetchApi<any>(`/admin/catalog/categories`, {
      method: "POST",
      body: JSON.stringify({ ...data, gameId })
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateProductCategory(gameId: string, categoryId: string, data: { name: string; icon: string; sortOrder: number }) {
  try {
    // Note: Add endpoint to AdminCatalog if not exists, for now fallback to putting if AdminCatalog has it
    await fetchApi<any>(`/admin/catalog/categories/${categoryId}`, {
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
    await fetchApi<any>(`/admin/catalog/categories/${categoryId}`, {
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
    // Note: Assuming bulk category mapping exists, else just placeholder
    await fetchApi<any>(`/admin/catalog/categories/${categoryId}/products`, {
      method: "PUT",
      body: JSON.stringify(productIds)
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
