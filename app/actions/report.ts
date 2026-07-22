"use server";

import { fetchApi } from "@/lib/api-client";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function requestAnalyticsReportExport(email: string, days: number) {
  try {
    const res = await fetchApi<any>("/AdminReport/export-email", {
      method: "POST",
      body: JSON.stringify({ email, days }),
    });

    return { success: true, message: res.message || "Laporan sedang diproses." };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal mengirim laporan." };
  }
}

export async function downloadCsvReport(days: number) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("auth_token")?.value;
    if (!token) {
      const session = await auth();
      // @ts-ignore
      token = session?.user?.apiToken;
    }
    
    const headers = new Headers();
    headers.set("ngrok-skip-browser-warning", "true");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${API_BASE_URL}/AdminReport/export-csv?days=${days}`, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const csvText = await res.text();
    return { success: true, data: csvText };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

