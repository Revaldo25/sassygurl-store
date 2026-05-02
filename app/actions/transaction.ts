"use server";

import { fetchApi } from "@/lib/api-client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const TransactionSchema = z.object({
  productId: z.string(),
  targetId: z.string().min(1, "Target ID wajib diisi"),
  zoneId: z.string().optional(),
  server: z.string().optional(),
  quantity: z.number().min(1).default(1),
  paymentMethod: z.string(),
  email: z.string().email("Format email salah").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  waNotif: z.boolean().default(false),
});

export type TransactionInput = z.infer<typeof TransactionSchema>;

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
};

export async function createTransaction(input: TransactionInput) {
  try {
    const validatedData = TransactionSchema.parse(input);

    // Call ASP.NET Core API
    const response = await fetchApi<ApiResponse<{ invoiceId: string; paymentToken: string }>>('/transactions', {
      method: 'POST',
      body: JSON.stringify(validatedData)
    });

    if (!response.success) {
      return { success: false, message: response.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: response.message,
      invoiceId: response.data.invoiceId,
      paymentToken: response.data.paymentToken, // Used to trigger Midtrans Pop-up in Client Component
    };
  } catch (error: any) {
    console.error("[CreateTransaction Action] Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Validasi data gagal: " + error.errors[0].message };
    }
    return { success: false, message: error.message || "Terjadi kesalahan internal saat membuat transaksi." };
  }
}