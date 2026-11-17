/**
 * Centralized API fetch utility
 * Provides typed responses and consistent error handling
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/** Pesan yang bisa dibaca kasir saat server tidak menjawab dalam bentuk JSON. */
function friendlyMessageForStatus(status: number): string {
  if (status === 502 || status === 503 || status === 504) {
    return "Server sedang sibuk atau sedang diperbarui. Coba lagi sebentar lagi.";
  }
  if (status === 401 || status === 403) {
    return "Sesi Anda tidak lagi berhak. Silakan masuk ulang.";
  }
  if (status === 404) {
    return "Data yang diminta tidak ditemukan.";
  }
  if (status >= 500) {
    return "Terjadi kesalahan pada server. Coba lagi sebentar lagi.";
  }
  return `Permintaan gagal (HTTP ${status}).`;
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

  // Balasan error dari proxy (502/504) atau halaman HTML tidak selalu JSON.
  // Dulu `res.json()` dipanggil langsung, sehingga pengguna melihat pesan
  // teknis "Failed to execute 'json' on 'Response': Unexpected token '<'"
  // alih-alih penjelasan yang bisa ditindaklanjuti.
  const raw = await res.text();
  let json: (T & { error?: string; message?: string; code?: string }) | null = null;
  if (raw) {
    try {
      json = JSON.parse(raw) as T & { error?: string; message?: string; code?: string };
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      json?.error || json?.message || friendlyMessageForStatus(res.status),
      res.status,
      json?.code
    );
  }

  if (json === null) {
    // 2xx tanpa body JSON: perlakukan sebagai sukses tanpa data.
    return {} as T;
  }

  return json as T;
}
