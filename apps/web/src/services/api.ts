const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ApiErrorResponse {
  error?: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { tenantId?: string } = {}
): Promise<T> {
  const { tenantId, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (tenantId) {
    headers["x-tenant-id"] = tenantId;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({ error: res.statusText }))) as ApiErrorResponse;
    throw new Error(error.error ?? "Erro desconhecido");
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestInit & { tenantId?: string }) =>
    apiFetch<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body: unknown,
    options?: RequestInit & { tenantId?: string }
  ) =>
    apiFetch<T>(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(
    path: string,
    body: unknown,
    options?: RequestInit & { tenantId?: string }
  ) =>
    apiFetch<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestInit & { tenantId?: string }) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),

  patch: <T>(
    path: string,
    body: unknown,
    options?: RequestInit & { tenantId?: string }
  ) =>
    apiFetch<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
