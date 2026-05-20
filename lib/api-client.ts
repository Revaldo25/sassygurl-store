import { cookies } from 'next/headers';
import { auth } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  let token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    const session = await auth();
    // @ts-ignore
    token = session?.user?.apiToken;
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      // For Next.js 14/15/16 caching behavior
      cache: options.cache || 'no-store',
    });

    let data: any = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) {
        console.error(`[API] Failed to parse JSON from ${endpoint}:`, e);
        throw new Error(`Invalid JSON response from ${endpoint}`);
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status} ${response.statusText}`);
    }

    return data as T;
  } catch (error: any) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}
