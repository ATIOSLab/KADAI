/**
 * Centralized API fetch utility
 * Provides typed responses and consistent error handling
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...rest,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(
      json.error || json.message || "Terjadi kesalahan",
      res.status
    );
  }

  return json as T;
}
