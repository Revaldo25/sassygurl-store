"use server";

import { fetchApi } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

// TYPES
export type DashboardStats = {
  totalSpent: number;
  totalOrders: number;
  successOrders: number;
  pendingOrders: number;
  balance: number;
  points: number;
  loyaltyLevel: string;
};

export type AdminStats = {
  totalTransactions: number;
  successTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalUsers: number;
  totalGames: number;
  totalProducts: number;
};

export type RecentTransaction = {
  id: string;
  invoiceId: string;
  gameName: string;
  productName: string;
  targetId: string;
  amount: number;
  profit: number;
  paymentStatus: string;
  orderStatus: string;
  providerRef?: string;
  createdAt: string;
};

export type AdminTransaction = RecentTransaction;

export type DailyRevenue = {
  date: string;
  revenue: number;
  profit: number;
  orderCount: number;
};

export type OwnerStats = {
  totalRevenue: number;
  totalProviderCost: number;
  netProfit: number;
  todayRevenue: number;
  todayProfit: number;
  totalTransactions: number;
  successTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalUsers: number;
  totalGames: number;
  totalProducts: number;
  refundQueueCount: number;
  dailyRevenue: DailyRevenue[];
};

// API ApiResponse matching C# wrapper
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
};

type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  perPage: number;
};

// --------------------------------------------------------------------------------
// MEMBER DASHBOARD ACTIONS
// --------------------------------------------------------------------------------

export async function getMemberDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await fetchApi<ApiResponse<DashboardStats>>('/Dashboard/member/stats');
    if (response.success && response.data) {
      return response.data;
    }
    return getDefaultMemberStats();
  } catch (error) {
    console.error("Error getMemberDashboardStats:", error);
    return getDefaultMemberStats();
  }
}

export async function getMemberTransactions(
  filter: "ALL" | "SUCCESS" | "PENDING" | "FAILED" = "ALL",
  search: string = ""
): Promise<RecentTransaction[]> {
  try {
    const params = new URLSearchParams();
    if (filter && filter !== "ALL") params.append("filter", filter);
    if (search) params.append("search", search);

    const response = await fetchApi<ApiResponse<PaginatedResponse<RecentTransaction>>>(`/Dashboard/member/transactions?${params.toString()}`);
    if (response.success && response.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Error getMemberTransactions:", error);
    return [];
  }
}

// --------------------------------------------------------------------------------
// ADMIN DASHBOARD ACTIONS
// --------------------------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const response = await fetchApi<ApiResponse<AdminStats>>('/Dashboard/admin/stats');
    if (response.success && response.data) {
      return response.data;
    }
    return getDefaultAdminStats();
  } catch (error) {
    console.error("Error getAdminStats:", error);
    return getDefaultAdminStats();
  }
}

export async function getAdminTransactions(
  filter: string = "ALL",
  search: string = "",
  page: number = 1,
  perPage: number = 15
): Promise<{ transactions: AdminTransaction[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (filter && filter !== "ALL") params.append("filter", filter);
    if (search) params.append("search", search);

    const response = await fetchApi<ApiResponse<PaginatedResponse<AdminTransaction>>>(`/Dashboard/admin/transactions?${params.toString()}`);
    if (response.success && response.data) {
      return { transactions: response.data.data, total: response.data.total };
    }
    return { transactions: [], total: 0 };
  } catch (error) {
    console.error("Error getAdminTransactions:", error);
    return { transactions: [], total: 0 };
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  orderStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR"
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchApi<ApiResponse<string>>(`/Transactions/${transactionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: orderStatus })
    });
    
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: response.success, message: response.message };
  } catch (error: any) {
    console.error("Error updating tx status:", error);
    return { success: false, message: error.message || "Gagal mengupdate status" };
  }
}

// --------------------------------------------------------------------------------
// OWNER DASHBOARD ACTIONS (SUPERADMIN only)
// --------------------------------------------------------------------------------

export async function getOwnerStats(): Promise<OwnerStats> {
  try {
    const response = await fetchApi<ApiResponse<OwnerStats>>('/Dashboard/owner/stats');
    if (response.success && response.data) {
      return response.data;
    }
    return getDefaultOwnerStats();
  } catch (error) {
    console.error("Error getOwnerStats:", error);
    return getDefaultOwnerStats();
  }
}


export async function triggerCatalogSync(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchApi<ApiResponse<any>>('/Sync/all', {
      method: 'POST',
      headers: {
        'X-Webhook-Secret': 'SASSY_ELITE_SECURE_2026'
      }
    });
    
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: response.success, message: response.message || "Sync triggered successfully" };
  } catch (error: any) {
    console.error("Error triggerCatalogSync:", error);
    return { success: false, message: error.message || "Gagal sinkronisasi katalog" };
  }
}

export async function getAdminGames(): Promise<any[]> {
  try {
    const response = await fetchApi<ApiResponse<any[]>>('/Catalog/games');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error getAdminGames:", error);
    return [];
  }
}

export async function createGame(data: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchApi<ApiResponse<any>>('/Catalog/games', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: response.success, message: response.message };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal membuat game" };
  }
}

export async function updateGame(id: string, data: any): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchApi<ApiResponse<any>>(`/Catalog/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath(`/game/${data.slug}`);
    return { success: response.success, message: response.message };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal update game" };
  }
}

export async function deleteGame(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetchApi<ApiResponse<any>>(`/Catalog/games/${id}`, {
      method: 'DELETE'
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: response.success, message: response.message };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal menghapus game" };
  }
}

// --------------------------------------------------------------------------------
// FALLBACKS / DEFAULTS
// --------------------------------------------------------------------------------

function getDefaultOwnerStats(): OwnerStats {
  return {
    totalRevenue: 0,
    totalProviderCost: 0,
    netProfit: 0,
    todayRevenue: 0,
    todayProfit: 0,
    totalTransactions: 0,
    successTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalUsers: 0,
    totalGames: 0,
    totalProducts: 0,
    refundQueueCount: 0,
    dailyRevenue: [],
  };
}

function getDefaultMemberStats(): DashboardStats {
  return {
    totalSpent: 0,
    totalOrders: 0,
    successOrders: 0,
    pendingOrders: 0,
    balance: 0,
    points: 0,
    loyaltyLevel: "BRONZE",
  };
}

function getDefaultAdminStats(): AdminStats {
  return {
    totalTransactions: 0,
    successTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalUsers: 0,
    totalGames: 0,
    totalProducts: 0,
  };
}
