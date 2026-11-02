"use client";

export async function api<T = unknown>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(url, {
    method: options?.method || (options?.body ? "POST" : "GET"),
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "خطای غیرمنتظره در ارتباط با سرور");
  }
  return data as T;
}

export const apiGet = <T,>(url: string) => api<T>(url);
export const apiPost = <T,>(url: string, body: unknown) => api<T>(url, { body });
