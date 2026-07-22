"use server";

import { fetchApi } from "@/lib/api-client";

export async function getActiveChatSessions() {
  try {
    const data = await fetchApi<any>("/LiveChat/sessions", { cache: "no-store" });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getChatHistory(sessionId: string) {
  try {
    const data = await fetchApi<any>(`/LiveChat/${sessionId}`, { cache: "no-store" });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

